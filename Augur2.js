const fs = require("fs"),
  Discord = require("discord.js"),
  {Collection, Client, Message} = Discord,
  axios = require("axios"),
  path = require("path"),
  u = require('../../utils/utils')

/************************
**  DEFAULT FUNCTIONS  **
************************/

const DEFAULTS = {
  errorHandler: (error, msg) => {
    console.error(Date());
    if (msg instanceof Discord.Message) {
      console.error(`${msg.author.username} in ${(msg.guild ? (`${msg.guild.name} > ${msg.channel.name}`) : "DM")}: ${msg.cleanContent}`);
    } else if (msg) {
      console.error(msg);
    }
    console.error(error);
  },
  parse: async (msg) => {
    let content = msg.content;
    let setPrefix = await u.prefix(msg)
    if (msg.author.bot) return null;
    for (let prefix of [setPrefix, `<@${msg.client.user.id}>`, `<@!${msg.client.user.id}>`]) {
      if (!content.startsWith(prefix)) continue;
      let [command, ...params] = content.substr(prefix.length).split(" ");
      if (command) {
        return {
          command: command.toLowerCase(),
          suffix: params.join(" "),
          params
        };
      }
    }
    return null;
  }
};

/*********************
**  SUPPORT CLASSES **
*********************/

class DiscordInteraction {
  constructor(client, data) {
    this.client = client;
    this.id = data.id;
    this.type = data.type;

    this.data = data.data;
    this.name = data.data?.name;
    this.commandId = data.data?.id;
    this.options = data.data?.options;

    this.guild = this.client.guilds.cache.get(data.guild_id);
    this.channel = this.client.channels.cache.get(data.channel_id);
    this.member = this.guild?.members.cache.get(data.member?.user.id);
    this.user = this.member?.user || this.client.users.cache.get(data.user?.id);
    this.token = data.token;
    this.version = data.version;

    this.deferred = null;
  }

  async _call(url, data, method = "get") {
    return (await axios({
      url,
      baseURL: "https://discord.com/api/v8/",
      method,
      headers: { "Authorization": `Bot ${this.client.token}` },
      data
    }))?.data;
  }

  async defer() {
    const data = {
      type: 5
    };
    let apiResponse = await this._call(`/interactions/${this.id}/${this.token}/callback`, data, "post");
    this.deferred = true;
    return true;
  }

  async createResponse(content, options = {}) {
    if (this.deferred) {
      return await this.editResponse(content, options);
    } else {
      let url = `/interactions/${this.id}/${this.token}/callback`;

      if (typeof content != "string") {
        options = content;
        content = "";
      };
      if (options.allowed_mentions === undefined) {
        options.allowed_mentions = {
          parse: ["users"]
        };
      }
      const response = {
        type: 4,
        data: {
          tts: options.tts ?? false,
          content,
          embeds: options.embeds,
          allowed_mentions: options.allowed_mentions,
          flags: options.flags
        }
      };
      let apiResponse = await this._call(url, response, "post");
      return new DiscordInteractionResponse(this, apiResponse);
    }
  }

  async createFollowup(content, options = {}) {
    let url = `/webhooks/${this.client.applicationId}/${this.token}`;

    if (typeof content != "string") {
      options = content;
      content = "";
    }
    if (options.allowed_mentions === undefined) {
      options.allowed_mentions = {
        parse: ["users"]
      };
    }
    const response = {
      content,
      embeds: options.embeds,
      file: options.file,
      allowed_mentions: options.allowed_mentions,
    };
    let apiReponse = await this._call(url, response, "post");
    return new DiscordInteractionResponse(this, apiReponse);
  }

  deleteResponse(message = "@original", timeout = 0) {
    return new Promise((fulfill, reject) => {
      try {
        setTimeout(() => {
          let url = `/webhooks/${this.client.applicationId}/${this.token}/messages/${(message.id ? message.id : message)}`;
          let apiResponse = this._call(url, undefined, "delete").then(fulfill, reject);
        }, timeout);
      } catch(e) { reject(e); }
    });
  }

  async editResponse(content, options = {}, message = "@original") {
    let url = `/webhooks/${this.client.applicationId}/${this.token}/messages/${(message.id ? message.id : message)}`;

    if (typeof content != "string") {
      options = content;
      content = "";
    };
    if (options.allowed_mentions === undefined) {
      options.allowed_mentions = {
        parse: ["users"]
      };
    }
    const response = {
      content,
      embeds: options.embeds,
      file: options.file,
      allowed_mentions: options.allowed_mentions,
    };
    let apiReponse = await this._call(url, response, "patch");
    return new DiscordInteractionResponse(this, apiReponse);
  }
}

class DiscordInteractionResponse extends Message {
  constructor(interaction, data) {
    let channel = interaction.client.channels.cache.get(data.channel_id);
    super(interaction.client, data, channel);
    this.interaction = interaction;
  }

  delete(options = {}) {
    return new Promise((fulfill, reject) => {
      setTimeout((msg) => {
        try {
          fulfill(this.interaction.deleteResponse(this));
        } catch(error) { reject(error); }
      }, options?.timeout || 0);
    });
  }

  edit(content, options) {
    return this.interaction.editResponse(content, options, this);
  }

  followup(content, options) {
    return this.interaction.createFollowup(content, options);
  }
}

/***************
**  MANAGERS  **
***************/

class ClockworkManager extends Collection {
  constructor(client) {
    super();
    this.client = client;
  }

  register(load) {
    if (load.clockwork) this.set(load.filepath, load.clockwork());
    return this;
  }

  unload(filepath) {
    if (this.has(filepath)) {
      clearInterval(this.get(filepath));
      this.delete(filepath);
    }
    return this;
  }
}

class CommandManager extends Collection {
  constructor(client) {
    super();
    this.client = client;
    this.aliases = new Collection();
    this.commandCount = 0;
  }

  async execute(msg, parsed) {
    try {
      let {command, suffix, params} = parsed;
      let commandGroup;
      if (this.has(command)) commandGroup = this;
      else if (this.aliases.has(command)) commandGroup = this.aliases;
      else return;

      this.commandCount++;
      let cmd = commandGroup.get(command);
      if (cmd.parseParams)
        return cmd.execute(msg, ...params);
      else
        return cmd.execute(msg, suffix);
    } catch(error) {
      return this.client.errorHandler(error, msg);
    }
  }

  register(load) {
    for (const command of load.commands) {
      try {
        command.file = load.file;
        command.client = load.client;
        if (!command.category) command.category = path.basename(command.file, ".js");

        if (!this.has(command.name.toLowerCase()))
          this.set(command.name.toLowerCase(), command);
        if (command.aliases.length > 0) {
          for (let alias of command.aliases.filter(a => !this.aliases.has(a.toLowerCase())))
            this.aliases.set(alias.toLowerCase(), command);
        }
      } catch(error) {
        this.client.errorHandler(error, `Register command "${command.name}" in ${load.filepath}`);
      }
    }
    return this;
  }
}

class EventManager extends Collection {
  constructor(client) {
    super();
    this.client = client;
  }

  register(load) {
    if (load.events?.size > 0) {
      for (const [event, handler] of load.events) {
        if (!this.has(event)) this.set(event, new Collection([[load.file, handler]]));
        else this.get(event).set(load.file, handler);
      }
    }
    return this;
  }
}

class InteractionManager extends Collection {
  constructor(client) {
    super();
    this.client = client;
  }

  async _call(url, data, method = "get") {
    return (await axios({
      url,
      baseURL: `https://discord.com/api/v8/applications/${this.client.applicationId}`,
      method,
      headers: { "Authorization": `Bot ${this.client.token}` },
      data
    })).data;
  }

  register(load) {
    for (const interaction of load.interactions) {
      try {
        interaction.file = load.file;
        if (this.has(interaction.id)) this.client.errorHandler(`Duplicate Interaction ID: ${interaction.id}`, `Interaction id ${interaction.id} already registered in \`${this.get(interaction.id).file}\`. It is being overwritten.`);
        this.set(interaction.id, interaction);
      } catch(error) {
        this.client.errorHandler(error, `Register interaction "${interaction.name}" in guild ${interaction.guild} in ${load.filepath}`);
      }
    }
    return this;
  }

  /*******************************
  **  GLOBAL COMMAND ENDPOINTS  **
  *******************************/

  getGlobalCommands(commandId) {
    return this._call(`/commands${(commandId ? `/${commandId}` : "")}`);
  }

  createGlobalCommand(data) {
    return this._call(`/commands`, data, "post");
  }

  editGlobalCommand(commandId, data) {
    return this._call(`/commands/${commandId}`, data, "patch");
  }

  deleteGlobalCommand(commandId) {
    return this._call(`/commands/${commandId}`, null, "delete");
  }

  /******************************
  **  GUILD COMMAND ENDPOINTS  **
  ******************************/

  getGuildCommands(guildId, commandId) {
    return this._call(`/guilds/${guildId}/commands${(commandId ? `/${commandId}` : "")}`);
  }

  createGuildCommand(guildId, data) {
    return this._call(`/guilds/${guildId}/commands`, data, "post");
  }

  editGuildCommand(guildId, commandId, data) {
    return this._call(`/guilds/${guildId}/commands/${commandId}`, data, "patch");
  }

  deleteGuildCommand(guildId, commandId) {
    return this._call(`/guilds/${guildId}/commands/${commandId}`, null, "delete");
  }
}

class ModuleManager {
  constructor(client) {
    this.client = client;
    this.clockwork = new ClockworkManager(client);
    this.commands = new CommandManager(client);
    this.events = new EventManager(client);
    this.interactions = new InteractionManager(client);
    this.unloads = new Map();

    client.clockwork = this.clockwork;
    client.commands = this.commands;
    client.events = this.events;
    client.interactions = this.interactions;
  }

  register(file, data) {
    if (file) {
      let filepath = path.resolve(file);
      try {
        const load = require(filepath);

        load.config = this.client.config;
        load.db = this.client.db;
        load.client = this.client;
        load.file = filepath;

        // REGISTER COMMANDS & ALIASES
        this.commands.register(load);

        // REGISTER EVENT HANDLERS
        this.events.register(load);

        // REGISTER CLOCKWORK
        this.clockwork.register(load);

        // REGISTER INTERACTIONS
        this.interactions.register(load);

        // RUN INIT()
        load.init?.(data);

        // REGISTER UNLOAD FUNCTION
        if (load.unload) this.unloads.set(filepath, load.unload);
      } catch(error) {
        this.client.errorHandler(error, `Register: ${filepath}`);
      }
    }
    return this;
  }

  reload(file) {
    if (file) {
      let filepath = path.resolve(file);
      try {
        let unloadData = this.unload(filepath);
        this.register(filepath, unloadData);
      } catch(error) {
        this.client.errorHandler(error, `Reload: ${filepath}`)
      }
    }
    return this;
  }

  unload(file) {
    if (file) {
      let filepath = path.resolve(file);
      try {
        // Clear Clockwork
        this.clockwork.unload(filepath);

        // Clear Event Handlers
        for (let [event, handlers] of this.events) {
          handlers.delete(filepath);
        }

        // Clear Interaction Handlers
        for (let [interactionId, interaction] of this.interactions) {
          if (interaction.file == filepath) this.interactions.delete(interactionId);
        }

        // Unload
        let unloadData;
        if (this.unloads.has(filepath)) {
          unloadData = this.unloads.get(filepath)();
          this.unloads.delete(filepath);
        }

        // Clear Commands and Aliases
        for (let [name, command] of this.commands) {
          if (command.file == filepath) this.commands.delete(name);
        }
        for (let [alias, command] of this.commands.aliases) {
          if (command.file == filepath) this.commands.aliases.delete(alias);
        }

        // Clear Require Cache
        delete require.cache[require.resolve(filepath)];

        return unloadData;
      } catch(error) {
        this.client.errorHandler(error, `Unload: ${filepath}`);
      }
    }
    return this;
  }

  unloadAll() {
    // Remove all clockwork intervals
    for (const [file, interval] of this.clockwork) {
      clearInterval(interval);
      this.clockwork.delete(file);
    }

    // Clear Event Handlers
    for (let [event, handlers] of this.events) {
      handlers.clear();
    }

    // Unload all files
    for (const [file, unload] of this.unloads) {
      try {
        unload();
      } catch(error) {
        this.client.errorHandler(error, `Unload: ${file}`);
      }
    }

    // Clear Commands and Aliases
    this.commands.clear();
    this.commands.aliases.clear();

    // Clear Interactions
    this.interactions.clear();

    return this;
  }
}

/*******************
**  AUGUR CLIENT  **
*******************/

class AugurClient extends Client {
  constructor(config, options = {}) {
    const calculateIntents = require("./intents");
    const intents = calculateIntents(config.events, config.processDMs);

    if (!options.clientOptions) options.clientOptions = {ws: { intents }};
    else if (!options.clientOptions.ws) options.clientOptions.ws = { intents };
    else if (!options.clientOptions.ws.intents) options.clientOptions.ws.intents = intents;

    super(options.clientOptions);

    this.moduleHandler = new ModuleManager(this);

    this.augurOptions = options;
    this.config = config;
    this.db = (this.config.db?.model ? require(path.resolve((require.main ? path.dirname(require.main.filename) : process.cwd()), this.config.db.model)) : null);
    this.errorHandler = this.augurOptions.errorHandler || DEFAULTS.errorHandler;
    this.parse = this.augurOptions.parse || DEFAULTS.parse;
    this.utils = this.augurOptions.utils

    // PRE-LOAD COMMANDS
    if (this.augurOptions?.commands) {
      const fs = require("fs");
      let commandPath = path.resolve(require.main ? path.dirname(require.main.filename) : process.cwd(), this.augurOptions.commands);
      try {
        let commandFiles = fs.readdirSync(commandPath).filter(f => f.endsWith(".js"));
        for (let command of commandFiles) {
          try {
            this.moduleHandler.register(path.resolve(commandPath, command));
          } catch(error) {
            this.errorHandler(error, `Error loading Augur Module ${command}`);
          }
        }
      } catch(error) {
        this.errorHandler(error, `Error loading module names from ${commandPath}`);
      }
    }


    // SET EVENT HANDLERS
    this.once("ready", async () => {
      this.applicationId = (await this.fetchApplication()).id;
    });

    this.on("ready", async () => {
      console.log(`${this.user.username} ${(this.shard ? ` Shard ${this.shard.id}` : "")} ready at: ${Date()}`);
      console.log(`Listening to ${this.channels.cache.size} channels in ${this.guilds.cache.size} servers.`);
      if (this.events.has("ready")) {
        for (let [file, handler] of this.events.get("ready")) {
          try {
            if (await handler()) break;
          } catch(error) {
            this.errorHandler(error, `Ready Handler: ${file}`);
          }
        }
      }
    });

    this.on("message", async (msg) => {
      let halt = false;
      if (this.events.has("message")) {
        if (msg.partial) {
          try {
            await msg.fetch();
          } catch(error) {
            this.errorHandler(error, "Augur Fetch Partial Message Error");
          }
        }
        for (let [file, handler] of this.events.get("message")) {
          try {
            halt = await handler(msg);
            if (halt) break;
          } catch(error) {
            this.errorHandler(error, msg);
            halt = true;
            break;
          }
        }
      }
      try {
        let parsed = await this.parse(msg);
        if (parsed && !halt) this.commands.execute(msg, parsed);
      } catch(error) {
        this.errorHandler(error, msg);
      }
    });

    this.on("messageUpdate", async (old, msg) => {
      if (old.content === msg.content) return;
      let halt = false;
      if (this.events.has("messageUpdate")) {
        if (msg.partial) {
          try {
            await msg.fetch();
          } catch(error) {
            this.errorHandler(error, "Augur Fetch Partial Message Update Error");
          }
        }
        for (let [file, handler] of this.events.get("messageUpdate")) {
          try {
            halt = await handler(old, msg);
            if (halt) break;
          } catch(error) {
            this.errorHandler(error, msg);
            halt = true;
            break;
          }
        }
      }
      try {
        let parsed = await this.parse(msg);
        if (parsed && !halt) this.commands.execute(msg, parsed);
      } catch(error) {
        this.errorHandler(error, msg);
      }
    });

    this.on("interactionCreate", async (interaction) => {
      let halt = false;
      if (this.events.has("interactionCreate")) {
        for (let [file, handler] of this.events.get("interactionCreate")) {
          try {
            halt = await handler(interaction);
            if (halt) break;
          } catch(error) {
            this.errorHandler(error, `interactionCreate Handler: ${file}`);
            break;
          }
        }
      }
      try {
        if (!halt) await this.interactions.get(interaction.commandId)?.execute(interaction);
      } catch(error) {
        this.errorHandler(error, `Interaction Processing: ${interaction.commandId}`);
      }
    });

    this.on("raw", async (data) => {
      if (data.t == "INTERACTION_CREATE") {
        const interaction = new DiscordInteraction(this, data.d);
        this.emit("interactionCreate", interaction);
      }
    });

    if (this.config.events.includes("messageReactionAdd")) {
      this.on("messageReactionAdd", async (reaction, user) => {
        if (this.events.get("messageReactionAdd")?.size > 0) {
          if (reaction.partial) {
            try {
              await reaction.fetch();
            } catch(error) {
              this.errorHandler(error, "Augur Fetch Partial Message Reaction Error");
            }
          }
          if (reaction.message?.partial) {
            try {
              await reaction.message.fetch();
            } catch(error) {
              this.errorHandler(error, "Augur Fetch Partial Reaction.Message Error");
            }
          }
          for (let [file, handler] of this.events.get("messageReactionAdd")) {
            try {
              if (await handler(reaction, user)) break;
            } catch(error) {
              this.errorHandler(error, `messageReactionAdd Handler: ${file}`);
              break;
            }
          }
        }
      });
    }

    let events = (this.config?.events || []).filter(event => !["message", "messageUpdate", "interactionCreate", "messageReactionAdd", "ready"].includes(event));

    for (let event of events) {
      this.on(event, async (...args) => {
        if (this.events.get(event)?.size > 0) {
          for (let [file, handler] of this.events.get(event)) {
            try {
              if (await handler(...args)) break;
            } catch(error) {
              this.errorHandler(error, `${event} Handler: ${file}`);
              break;
            }
          }
        }
      });
    }
  }

  destroy() {
    try {
      this.moduleHandler.unloadAll()
    } catch(error) {
      this.errorHandler(error, "Unload prior to destroying client.");
    }
    return super.destroy();
  }

  login(token) {
    return super.login(token || this.config?.token);
  }
}

/***********************
**  MODULE CONTAINER  **
***********************/

class AugurModule {
  constructor() {
    this.commands = [];
    this.interactions = [];
    this.events = new Collection();
    this.config = {};
  }

  addCommand(info = {
    name: String,
    aliases: Array,
    syntax: String,
    description: String,
    info: String,
    hidden: Boolean (false),
    category: String,
    enabled: Boolean (true),
    otherPerms: Function,
    permissions: Array,
    parseParams: Function,
    options: Object,
    process: Function,
    onlyOwner: Boolean (false),
    onlyGuild: Boolean (false),
    onlyDm: Boolean (false)
  }) {
    this.commands.push(new AugurCommand(info, this.client));
    return this;
  }

  addEvent(name = String, handler = Function) {
    this.events.set(name, handler);
    return this;
  }

  addInteraction(info = {
    id: String,
    name: String,
    syntax: String,
    description: String,
    info: String,
    hidden: Boolean (false),
    category: String,
    enabled: Boolean (true),
    options: Object,
    otherPerms: Function,
    permissions: Array,
    process: Function,
    onlyOwner: Boolean (false),
    onlyGuild: Boolean (false),
    onlyDm: Boolean (false)
  }) {
    this.interactions.push(new AugurInteractionCommand(info, this.client));
    return this;
  }

  setClockwork(clockwork) {
    this.clockwork = clockwork;
    return this;
  }

  setInit(init) {
    this.init = init;
    return this;
  }

  setUnload(unload) {
    this.unload = unload;
    return this;
  }
}

/********************
**  COMMAND CLASS  **
********************/

class AugurCommand {
  constructor(info, client) {
    if (!info.name || !info.process) {
      throw new Error("Commands must have the `name` and `process` properties");
    }
    this.name = info.name;
    this.aliases = info.aliases ?? [];
    this.syntax = info.syntax ?? "";
    this.description = info.description ?? `${this.name} ${this.syntax}`.trim();
    this.info = info.info ?? this.description;
    this.hidden = info.hidden ?? false;
    this.category = info.category ?? "General";
    this.enabled = info.enabled ?? true;
    this.otherPerms = info.other || (() => true);
    this.permissions = info.permissions;
    this.parseParams = info.parseParams ?? false;
    this.options = info.options ?? {};
    this.process = info.process;
    this.onlyOwner = info.onlyOwner || false;
    this.onlyGuild = info.onlyGuild || false;
    this.onlyDm = info.onlyDm || false;

    this.client = client;
  }

  async execute(msg, args) {
    try {
      if(!this.enabled) return
      else if(this.onlyOwner && msg.author.id != msg.client.config.ownerId) return;
      else if(this.onlyGuild && !msg.guild) return msg.channel.send(`That command can only be used in a server.`).then(m => u.clean([msg, m]));
      else if(this.onlyDm && msg.guild) return msg.channel.send(`That command can only be used in a DM`).then(m => u.clean([msg, m]));
      else if(msg.guild ? !msg.member.hasPermission(this.permissions) : false) return msg.channel.send(`You don't have permission to use that command!`)
      else if (await this.otherPerms(msg)) return await this.process(msg, args);
      else return;
    } catch(error) {
      if (this.client) this.client.errorHandler(error, msg);
      else console.error(error);
    }
  }
}

class AugurInteractionCommand {
  constructor(info, client) {
    if (!info.id || !info.process) {
      throw new Error("Commands must have the `id` and `process` properties");
    }
    this.id = info.id;
    this.name = info.name;
    this.syntax = info.syntax ?? "";
    this.description = info.description ?? `${this.name} ${this.syntax}`.trim();
    this.info = info.info ?? this.description;
    this.hidden = info.hidden ?? false;
    this.category = info.category;
    this.enabled = info.enabled ?? true;
    this.options = info.options ?? {};
    this.otherPerms = info.other || (() => true);
    this.permissions = info.permissions;
    this.process = info.process;
    this.onlyOwner = info.onlyOwner || false;
    this.onlyGuild = info.onlyGuild || false;
    this.onlyDm = info.onlyDm || false;

    this.client = client;
  }

  async execute(interaction) {
    try {
      if(!this.enabled) return
      else if(this.onlyOwner && interaction.author.id != this.client.config.ownerId) return;
      else if(this.onlyGuild && !interaction.guild) return interaction.createResponse(`That command can only be used in a server.`).then(u.clean());
      else if(this.onlyDm && interaction.guild) return interaction.createResponse(`That command can only be used in a DM`).then(u.clean);
      else if(interaction.guild ? !interaction.member.hasPermission(this.permissions) : false) return interaction.createResponse(`You don't have permission to use that command!`)
      else if (await this.otherPerms(interaction)) return await this.process(interaction);
      if (await this.permissions(interaction)) return await this.process(interaction);
      let msg = await interaction.createResponse("âŒ");
      msg.delete(5000).catch(error => this.client.errorHandler(error, "Remove Response After Failed Interaction Permissions Check"));
    } catch(error) {
      if (this.client) this.client.errorHandler(error, msg);
      else console.error(error);
    }
  }
}

/**************
**  EXPORTS  **
**************/

module.exports = {
  AugurClient,
  AugurCommand,
  AugurInteractionCommand,
  Module: AugurModule,
  DiscordInteraction,
  DiscordInteractionResponse,
  ClockworkManager,
  CommandManager,
  EventManager,
  InteractionManager,
  ModuleManager
};
