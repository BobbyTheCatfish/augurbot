import fs from 'fs'
import Discord, {
    Collection,
    Client,
    Message
} from 'discord.js'
import axios from 'axios'
import path from 'path'

type parsed = {
    command: string
    suffix: string
    params: string[]
}
import calculateIntents from './intents.js'

type ErrorHandler = (error: Error | string, msg: Discord.Message | Discord.BaseInteraction | string | Discord.PartialMessage | undefined) => void;
type parse = (msg: Discord.Message) => parsed | null;
type BotConfig = {
    events: (keyof Discord.ClientEvents)[]
    processDMs: boolean
    db: {model: string}
    token: string
    ownerId: string
    applicationId?: string
    prefix?: string
}

type AugurOptions = {
    clientOptions?: Discord.ClientOptions
    errorHandler?: ErrorHandler
    parse?: parse
    utils?: any
    commands?: string
}
type init = (thing: any) => void
type unload = (thing: any) => any
type Clockwork = () => NodeJS.Timeout

declare module 'discord.js' {
    interface Client {
        prefix: string;
        errorHandler: ErrorHandler
        parse: parse
        clockwork: ClockworkManager;
        commands: CommandManager;
        events: EventManager;
        interactions: InteractionManager
        config: BotConfig
        db: any
        applicationId: string
    }
}

/************************
 **  DEFAULT FUNCTIONS  **
 ************************/

const DEFAULTS = {
    errorHandler: (error: Error | string, msg?: any) => {
        console.error(Date());
        if (msg instanceof Discord.Message) {
            console.error(`${msg.author.username} in ${(msg.guild ? (`${msg.guild.name} > ${(msg.channel as Discord.GuildChannel).name}`) : "DM")}: ${msg.cleanContent}`);
        } else if (msg) {
            console.error(msg);
        }
        console.error(error);
    },

    parse: (msg: Discord.Message) => {
        let content = msg.content;
        let setPrefix = msg.client.prefix || "!"
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


/***************
 **  MANAGERS  **
 ***************/

class ClockworkManager extends Collection<string, NodeJS.Timeout> {
    client: Discord.Client
    constructor(client: Discord.Client) {
        super();
        this.client = client;
    }

    register(load: {clockwork: Clockwork, filepath: string}) {
        if (load.clockwork) this.set(load.filepath, load.clockwork());
        return this;
    }

    unload(filepath: string) {
        if (this.has(filepath)) {
            clearInterval(this.get(filepath));
            this.delete(filepath);
        }
        return this;
    }
}


class CommandManager extends Collection<string, AugurCommand> {
    client: Discord.Client;
    aliases: Collection<string, AugurCommand>;
    commandCount: number;
    constructor(client: Discord.Client) {
        super();
        this.client = client;
        this.aliases = new Collection();
        this.commandCount = 0;
    }
    async execute(msg: Discord.Message, parsed: parsed) {
        try {
            let {
                command,
                suffix,
                params
            } = parsed;
            let commandGroup: Collection<string, AugurCommand>;
            if (this.has(command)) commandGroup = this;
            else if (this.aliases.has(command)) commandGroup = this.aliases;
            else return;

            this.commandCount++;
            let cmd = commandGroup.get(command);
            if (cmd?.parseParams)
                return cmd.execute(msg, params);
            else
                return cmd?.execute(msg, [suffix]);
        } catch (error: any) {
            return this.client.errorHandler(error, msg);
        }
    }

    register(load: {file: string, filepath: string, client: Discord.Client, commands: [AugurCommand]}) {
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
            } catch (error: any) {
                this.client.errorHandler(error, `Register command "${command.name}" in ${load.filepath}`);
            }
        }
        return this;
    }
}

class EventManager extends Collection<string, Collection<string, Function>> {
    client: Discord.Client
    constructor(client: Discord.Client) {
        super();
        this.client = client;
    }

    register(load: {events: Collection<string, Function>, file: string}) {
        if (load.events?.size > 0) {
            for (const [event, handler] of load.events) {
                if (!this.has(event)) this.set(event, new Collection([
                    [load.file, handler]
                ]));
                else this.get(event)?.set(load.file, handler);
            }
        }
        return this;
    }
}

class InteractionManager extends Collection<string, AugurInteractionCommand> {
    client: Discord.Client
    constructor(client: Discord.Client) {
        super();
        this.client = client;
    }

    async _call(url: string, data?: any, method = "get") {
        return (await axios({
            url,
            baseURL: `https://discord.com/api/v10/applications/${this.client.applicationId}`,
            method,
            headers: {
                "Authorization": `Bot ${this.client.token}`
            },
            data
        })).data;
    }

    register(load: {interactions: AugurInteractionCommand[], file: string, filepath: string}) {
        for (const interaction of load.interactions) {
            try {
                interaction.file = load.file;
                if (this.has(interaction.id)) this.client.errorHandler(`Duplicate Interaction ID: ${interaction.id}`, `Interaction id ${interaction.id} already registered in \`${this.get(interaction.id)?.file}\`. It is being overwritten.`);
                this.set(interaction.id, interaction);
            } catch (error: any) {
                this.client.errorHandler(error, `Register interaction "${interaction.name}" in guild ${interaction.guild} in ${load.filepath}`);
            }
        }
        return this;
    }

    /*******************************
     **  GLOBAL COMMAND ENDPOINTS  **
     *******************************/

    getGlobalCommands(commandId: string) {
        return this._call(`/commands${(commandId ? `/${commandId}` : "")}`);
    }

    createGlobalCommand(data: Discord.ApplicationCommandData) {
        return this._call(`/commands`, data, "post");
    }

    editGlobalCommand(commandId: string, data: Discord.ApplicationCommandData) {
        return this._call(`/commands/${commandId}`, data, "patch");
    }

    deleteGlobalCommand(commandId: string) {
        return this._call(`/commands/${commandId}`, null, "delete");
    }

    /******************************
     **  GUILD COMMAND ENDPOINTS  **
     ******************************/

    getGuildCommands(guildId: string, commandId: string) {
        return this._call(`/guilds/${guildId}/commands${(commandId ? `/${commandId}` : "")}`);
    }

    createGuildCommand(guildId: string, data: Discord.ApplicationCommandData) {
        return this._call(`/guilds/${guildId}/commands`, data, "post");
    }

    editGuildCommand(guildId: string, commandId: string, data: Discord.ApplicationCommandData) {
        return this._call(`/guilds/${guildId}/commands/${commandId}`, data, "patch");
    }

    deleteGuildCommand(guildId: string, commandId: string) {
        return this._call(`/guilds/${guildId}/commands/${commandId}`, null, "delete");
    }
}

class ModuleManager {
    client: Discord.Client
    clockwork: ClockworkManager
    commands: CommandManager
    events: EventManager
    interactions: InteractionManager
    unloads: Map<string, Function>
    constructor(client: Discord.Client) {
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

    register(file: string, data?: init) {
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
            } catch (error: any) {
                this.client.errorHandler(error, `Register: ${filepath}`);
            }
        }
        return this;
    }

    reload(file: string) {
        if (file) {
            let filepath = path.resolve(file);
            try {
                let unloadData = this.unload(filepath);
                this.register(filepath, unloadData);
            } catch (error: any) {
                this.client.errorHandler(error, `Reload: ${filepath}`)
            }
        }
        return this;
    }

    unload(file: string) {
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
                    unloadData = (this.unloads.get(filepath) ?? (() => {}))();
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
            } catch (error: any) {
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
            } catch (error: any) {
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

    moduleHandler: ModuleManager
    augurOptions: AugurOptions
    errorHandler: ErrorHandler
    parse: parse
    utils: any
    applicationId: string
    config: BotConfig
    db: any
    constructor(config: BotConfig, options: AugurOptions = {}) {
        
        const intents = calculateIntents(config.events, config.processDMs);

        if (!options.clientOptions) options.clientOptions = {
                intents
        };
        else if (!options.clientOptions.intents) options.clientOptions.intents = intents

        super(options.clientOptions);

        this.moduleHandler = new ModuleManager(this);

        this.augurOptions = options;
        this.config = config;
        this.db = (this.config.db?.model ? require(path.resolve((require.main ? path.dirname(require.main.filename) : process.cwd()), this.config.db.model)) : null);
        this.errorHandler = this.augurOptions.errorHandler || DEFAULTS.errorHandler;
        this.parse = this.augurOptions.parse || DEFAULTS.parse;
        this.utils = this.augurOptions.utils
        this.applicationId = ""
        // PRE-LOAD COMMANDS
        if (this.augurOptions?.commands) {
            let commandPath = path.resolve(require.main ? path.dirname(require.main.filename) : process.cwd(), this.augurOptions.commands);
            try {
                let commandFiles = fs.readdirSync(commandPath).filter(f => f.endsWith(".js"));
                for (let command of commandFiles) {
                    try {
                        this.moduleHandler.register(path.resolve(commandPath, command));
                    } catch (error: any) {
                        this.errorHandler(error, `Error loading Augur Module ${command}`);
                    }
                }
            } catch (error: any) {
                this.errorHandler(error, `Error loading module names from ${commandPath}`);
            }
        }


        // SET EVENT HANDLERS
        this.once("ready", async () => {
            this.applicationId = (await this.application?.fetch())?.id ?? "";
        });

        this.on("ready", async () => {
            console.log(`${this.user?.username} ${(this.shard ? ` Shard ${this.shard.ids}` : "")} ready at: ${Date()}`);
            console.log(`Listening to ${this.channels.cache.size} channels in ${this.guilds.cache.size} servers.`);
            if (this.events.has("ready")) {
                for (let [file, handler] of this.events.get("ready") ?? new Collection()) {
                    try {
                        if (await handler()) break;
                    } catch (error: any) {
                        this.errorHandler(error, `Ready Handler: ${file}`);
                    }
                }
            }
        });

        this.on("messageCreate", async (msg) => {
            let halt = false;
            if (this.events.has("message")) {
                if (msg.partial) {
                    try {
                        await msg.fetch();
                    } catch (error: any) {
                        this.errorHandler(error, "Augur Fetch Partial Message Error");
                    }
                }
                for (let [file, handler] of this.events.get("message") ?? new Collection()) {
                    try {
                        halt = await handler(msg);
                        if (halt) break;
                    } catch (error: any) {
                        this.errorHandler(error, msg);
                        halt = true;
                        break;
                    }
                }
            }
            try {
                let parsed = this.parse(msg);
                if (parsed && !halt) this.commands.execute(msg, parsed);
            } catch (error: any) {
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
                    } catch (error: any) {
                        return this.errorHandler(error, "Augur Fetch Partial Message Update Error");
                    }
                }
                msg = msg as Message
                for (let [file, handler] of this.events.get("messageUpdate") ?? new Collection()) {
                    try {
                        halt = await handler(old, msg);
                        if (halt) break;
                    } catch (error: any) {
                        this.errorHandler(error, msg);
                        halt = true;
                        break;
                    }
                }
            }
            try {
                if (msg.partial) {
                    try {
                        await msg.fetch();
                    } catch (error: any) {
                        return this.errorHandler(error, "Augur Fetch Partial Message Update Error");
                    }
                }
                msg = msg as Discord.Message
                let parsed = this.parse(msg);
                if (parsed && !halt) this.commands.execute(msg, parsed);
            } catch (error: any) {
                this.errorHandler(error, msg);
            }
        });

        this.on("interactionCreate", async (interaction) => {
            let halt = false;
            if (this.events.has("interactionCreate")) {
                for (let [file, handler] of this.events.get("interactionCreate") ?? new Collection()) {
                    try {
                        halt = await handler(interaction);
                        if (halt) break;
                    } catch (error: any) {
                        this.errorHandler(error, `interactionCreate Handler: ${file}`);
                        break;
                    }
                }
            }
            try {
                if (!halt) await this.interactions.get(interaction.id)?.execute(interaction);
            } catch (error: any) {
                this.errorHandler(error, `Interaction Processing: ${interaction.id}`);
            }
        });


        if (this.config.events.includes("messageReactionAdd")) {
            this.on("messageReactionAdd", async (reaction, user) => {
                if ((this.events.get("messageReactionAdd")?.size ?? 0) > 0) {
                    if (reaction.partial) {
                        try {
                            await reaction.fetch();
                        } catch (error: any) {
                            this.errorHandler(error, "Augur Fetch Partial Message Reaction Error");
                        }
                    }
                    if (reaction.message?.partial) {
                        try {
                            await reaction.message.fetch();
                        } catch (error: any) {
                            this.errorHandler(error, "Augur Fetch Partial Reaction.Message Error");
                        }
                    }
                    for (let [file, handler] of this.events.get("messageReactionAdd") ?? new Collection()) {
                        try {
                            if (await handler(reaction, user)) break;
                        } catch (error: any) {
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
                if ((this.events.get(event)?.size ?? 0) > 0) {
                    for (let [file, handler] of this.events.get(event) ?? new Collection()) {
                        try {
                            if (await handler(...args)) break;
                        } catch (error: any) {
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
        } catch (error: any) {
            this.errorHandler(error, "Unload prior to destroying client.");
        }
        return super.destroy();
    }

    login(token: string) {
        return super.login(token || this.config?.token);
    }
}

/***********************
 **  MODULE CONTAINER  **
 ***********************/

class AugurModule {
    commands: AugurCommand[]
    interactions: AugurInteractionCommand[]
    events: Collection<string, Function>
    config: BotConfig | {}
    client!: Discord.Client
    clockwork?: Clockwork
    init?: init
    unload?: unload
    constructor() {
        this.commands = [];
        this.interactions = [];
        this.events = new Collection();
        this.config = {};
    }

    addCommand(info: AugurCommandInfo) {
        this.commands.push(new AugurCommand(info, this.client));
        return this;
    }

    addEvent(name: keyof Discord.ClientEvents, handler: Function) {
        this.events.set(name, handler);
        return this;
    }


    addInteraction(info: AugurInteractionCommandInfo) {
        this.interactions.push(new AugurInteractionCommand(info, this.client));
        return this;
    }

    setClockwork(clockwork: Clockwork) {
        this.clockwork = clockwork;
        return this;
    }

    setInit(init: init) {
        this.init = init;
        return this;
    }

    setUnload(unload: unload) {
        this.unload = unload;
        return this;
    }
}

/********************
 **  COMMAND CLASS  **
 ********************/

type AugurCommandInfo = {
    parseParams: boolean
    category: string
    name: string
    aliases: string[]
    syntax: string
    description: string
    info: string
    hidden: boolean
    enabled: boolean
    userPermissions: []
    permissions: (msg: Discord.Message) => Promise<boolean>
    options: any
    process: (msg: Discord.Message, ...args: string[]) => Promise<void>
    onlyOwner: boolean
    onlyGuild: boolean
    onlyDm: boolean
}

class AugurCommand {
    file: string
    client: Discord.Client
    parseParams: boolean
    category: string
    name: string
    aliases: string[]
    syntax: string
    description: string
    info: string
    hidden: boolean
    enabled: boolean
    userPermissions: []
    permissions: (msg: Discord.Message) => Promise<boolean>
    options: any
    process: (msg: Discord.Message, ...args: string[]) => Promise<void>
    onlyOwner: boolean
    onlyGuild: boolean
    onlyDm: boolean

    constructor(info: AugurCommandInfo, client: Discord.Client) {
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
        this.permissions = info.permissions || (async (msg) => true);
        this.userPermissions = info.userPermissions;
        this.parseParams = info.parseParams ?? false;
        this.options = info.options ?? {};
        this.process = info.process;
        this.onlyOwner = info.onlyOwner || false;
        this.onlyGuild = info.onlyGuild || false;
        this.onlyDm = info.onlyDm || false;
        this.file = ""
        this.client = client;
    }

    async execute(msg: Discord.Message, args: string[]) {
        try {
            if (!this.enabled) return
            else if (this.onlyOwner && msg.author.id != msg.client.config.ownerId) return;
            else if (this.onlyGuild && !msg.guild) return msg.channel.send(`That command can only be used in a server.`)
            else if (this.onlyDm && msg.guild) return msg.channel.send(`That command can only be used in a DM`)
            else if (this.userPermissions?.length > 0 && (msg.guild ? !msg.member?.permissions.any(this.userPermissions, true) : false)) return msg.channel.send(`You don't have permission to use that command!`)
            else if (await this.permissions(msg)) return await this.process(msg, ...args);
            else return;
        } catch (error: any) {
            if (this.client) this.client.errorHandler(error, msg);
            else console.error(error);
        }
    }
}

type AugurInteractionCommandInfo = {
    id: string
    name: string
    guild?: Discord.Guild
    syntax: string
    description: string
    info: string
    hidden: boolean
    category: string
    enabled: boolean
    options: any
    userPermissions: []
    validation: (int: Discord.BaseInteraction) => Promise<boolean>
    process: (int: Discord.BaseInteraction) => Promise<void>
    onlyOwner: boolean
    onlyGuild: boolean
    onlyDm: boolean
}

class AugurInteractionCommand {
    file: string
    id: string
    name: string
    guild?: Discord.Guild
    syntax: string
    description: string
    info: string
    hidden: boolean
    category: string
    enabled: boolean
    options: any
    userPermissions: []
    validation: (int: Discord.BaseInteraction) => Promise<boolean>
    process: (int: Discord.BaseInteraction) => Promise<void>
    onlyOwner: boolean
    onlyGuild: boolean
    onlyDm: boolean
    client!: Discord.Client
    constructor(info: AugurInteractionCommandInfo, client: Discord.Client) {
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
        this.userPermissions = info.userPermissions;
        this.validation = info.validation || (async () => true);
        this.process = info.process;
        this.onlyOwner = info.onlyOwner || false;
        this.onlyGuild = info.onlyGuild || false;
        this.onlyDm = info.onlyDm || false;
        this.file = ""
        this.client = client;
    }

    async execute(interaction: Discord.BaseInteraction) {
        try {
            let reply = ""
            if (!this.enabled) return
            else if (this.onlyOwner && interaction.member?.user.id != this.client.config.ownerId) return;
            else if (this.onlyGuild && !interaction.guild) reply = `That command can only be used in a server.`
            else if (this.onlyDm && interaction.guild) reply = `That command can only be used in a DM`
            else if (interaction.guild ? !(interaction.member?.permissions as Discord.PermissionsBitField).any(this.userPermissions) : false) reply = `You don't have permission to use that command!`
            if (!reply && await this.validation(interaction)) return await this.process(interaction);
            else if (interaction.isRepliable()) {
                interaction.reply({content: reply, ephemeral: true})
            }
        } catch (error: any) {
            if (this.client) this.client.errorHandler(error, interaction);
            else console.error(error);
        }
    }
}

/**************
 **  EXPORTS  **
 **************/


export {
    AugurClient,
    AugurCommand,
    AugurInteractionCommand,
    AugurModule as Module,
    ClockworkManager,
    CommandManager,
    EventManager,
    InteractionManager,
    ModuleManager
}
