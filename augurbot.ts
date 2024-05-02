import fs from 'fs'
import Discord, {
    Collection,
    Client,
    Message
} from 'discord.js'
import axios from 'axios'
import path from 'path'
import calculateIntents from './intents.js'

type parsed = {
    command: string
    suffix: string
    params: string[]
}

type ErrorHandler = (error: Error | string, message?: Message | Discord.PartialMessage | Discord.Interaction | string ) => void;
type parse = (message: Discord.Message) => Promise<parsed | null> | parsed | null;
type commandExecution = (cmd: AugurCommand, message: Discord.Message, args: string[]) => Promise<any> | any;
type interactionExecution = (cmd: AugurInteractionCommand, interaction: Discord.Interaction) => Promise<any> | any;
type opBool = boolean | undefined

/** Standard configuration for the bot. Can be extended to include more properties of your choice, but that isn't reccomended since you won't get any type support. */
type BotConfig = {
    events: (keyof Discord.ClientEvents)[]
    processDMs?: boolean
    db: {model: string}
    token: string
    ownerId: string
    applicationId?: string
    prefix?: string
    strictTypes?: { channels: boolean };
}

type optionalClientOptions = {
    intents?: Discord.BitFieldResolvable<Discord.GatewayIntentsString, number>
}

/** Options for the client object */
type AugurOptions = {
    clientOptions?: Omit<Discord.ClientOptions, "intents"> & optionalClientOptions
    errorHandler?: ErrorHandler
    parse?: parse
    commandExecution?: commandExecution
    interactionExecution?: interactionExecution
    commands?: string
}

/** Function to run on module load */
type init = (load: any) => void

/** Function to run on module unload */
type unload = () => any

/** Function to run a timeout on module load */
type Clockwork = () => NodeJS.Timeout

type interactionTypes <K extends Discord.CacheType = Discord.CacheType> = {
    AutoComplete: Discord.AutocompleteInteraction<K>
    Any: Discord.Interaction<K>
    Button: Discord.ButtonInteraction<K>
    CommandSlash: Discord.ChatInputCommandInteraction<K>
    CommandBase: Discord.CommandInteraction<K>
    ContextMessage: Discord.MessageContextMenuCommandInteraction<K>
    ContextUser: Discord.UserContextMenuCommandInteraction<K>
    ContextBase: Discord.ContextMenuCommandInteraction<K>
    MessageComponent: Discord.MessageComponentInteraction<K>
    Modal: Discord.ModalSubmitInteraction<K>
    SelectMenuChannel: Discord.ChannelSelectMenuInteraction<K>
    SelectMenuMentionable: Discord.MentionableSelectMenuInteraction<K>
    SelectMenuRole: Discord.RoleSelectMenuInteraction<K>
    SelectMenuString: Discord.StringSelectMenuInteraction<K>
    SelectMenuUser: Discord.UserSelectMenuInteraction<K>
}

type NoAutoComplete <K extends Discord.CacheType = Discord.CacheType> = Omit<interactionTypes<K>, "AutoComplete">

type GuildInteraction <K extends keyof interactionTypes<"cached">> =  interactionTypes<"cached">[K]

declare module 'discord.js' {
    interface Client {
        prefix: string;
        errorHandler: ErrorHandler
        parse: parse
        commandExecution: commandExecution;
        interactionExecution: interactionExecution;
        clockwork: ClockworkManager;
        commands: CommandManager;
        events: EventManager;
        interactions: InteractionManager
        config: BotConfig
        applicationId: string
        db: any
        getTextChannel (id: string): Discord.TextChannel | null
        getDmChannel (id: string): Discord.DMChannel | null
        getGroupDmChannel (id: string): Discord.PartialGroupDMChannel | null
        getVoiceChannel (id: string): Discord.VoiceChannel | null
        getCategoryChannel (id: string): Discord.CategoryChannel | null
        getNewsChannel (id: string): Discord.NewsChannel | null
        getAnnouncementsThread (id: string): Discord.PublicThreadChannel | null
        getPublicThread (id: string): Discord.PublicThreadChannel | null
        getPrivateThread (id: string): Discord.PrivateThreadChannel | null
        getStage (id: string): Discord.StageChannel | null
        getDirectory (id: string): Discord.DirectoryChannel | null
        getForumChannel (id: string): Discord.ForumChannel | null
    }
}

/** 
 ** DEFAULT FUNCTIONS*/

const DEFAULTS = {
    errorHandler: (error: Error | string, message?: any) => {
        console.error(Date());
        if (message instanceof Discord.Message) {
            console.error(`${message.author.username} in ${(message.guild ? (`${message.guild.name} > ${(message.channel as Discord.GuildChannel).name}`) : "DM")}: ${message.cleanContent}`);
        } else if (message) {
            console.error(message);
        }
        console.error(error);
    },

    parse: async (message: Discord.Message) => {
        let content = message.content;
        let setPrefix = message.client.prefix || "!"
        if (message.author.bot) return null;
        for (let prefix of [setPrefix, `<@${message.client.user.id}>`, `<@!${message.client.user.id}>`]) {
            if (!content.startsWith(prefix)) continue;
            let [command, ...params] = content.substring(prefix.length).split(" ");
            if (command) {
                return {
                    command: command.toLowerCase(),
                    suffix: params.join(" "),
                    params
                };
            }
        }
        return null;
    },

    commandExecution: async (cmd: AugurCommand, message: Discord.Message, args: string[]) => {
        try {
            
            let reply = ""
            /**Enabled*/ if (!cmd.enabled) return
            /**Only Owner*/ else if (cmd.onlyOwner && message.author.id != message.client.config.ownerId) return;
            /**Only Guild*/ else if (cmd.onlyGuild && !message.guild) reply = `That command can only be used in a server.`
            /**Only DM*/ else if (cmd.onlyDm && message.guild) reply = `That command can only be used in a DM`
            /**userPermissions*/ else if (cmd.userPermissions?.length > 0 && (message.guild ? !message.member?.permissions.has(cmd.userPermissions, true) : true)) reply = `You don't have permission to use that command!`
            /**permissions*/ else if (!await cmd.permissions(message)) reply = `You don't have permission to use that command!`
            if (reply) return message.reply(reply).then(DEFAULTS.clean)
            else return await cmd.process(message, ...args);

        } catch (error: any) {
            if (cmd.client) cmd.client.errorHandler(error, message);
            else console.error(error);
        }
    },

    interactionExecution: async (cmd: AugurInteractionCommand, interaction: Discord.Interaction) => {
        try {
            let reply = ""
            /**Enabled*/ if (!cmd.enabled) return
            /**Only Owner*/ else if (cmd.onlyOwner && interaction.member?.user.id != cmd.client.config.ownerId) return;
            /**Only Guild*/ else if (cmd.onlyGuild && !interaction.guild) reply = `That command can only be used in a server.`
            /**Only Specific Guild*/ else if (cmd.guildId && interaction.guild?.id != cmd.guildId) reply = `That command can only be used in a specific server.`
            /**Only DM*/ else if (cmd.onlyDm && interaction.guild) reply = `That command can only be used in a DM`
            /**userPermissions*/ else if (cmd.userPermissions.length > 0 && (interaction.inGuild() ? !(interaction.member.permissions as Discord.PermissionsBitField).has(cmd.userPermissions) : true)) reply = `You don't have permission to use that command!`
            /**permissions*/ else if (!await cmd.permissions(interaction)) reply = `You don't have permission to use that command!`
            if (interaction.isAutocomplete()) {
                if (reply) return;
                else return await cmd.autocomplete(interaction)
            } else {
                if (reply) {
                    if (!interaction.replied && !interaction.deferred) interaction.reply({content: reply, ephemeral: true})
                    else interaction.editReply({content: reply})
                }
                else return await cmd.process(interaction)
            }
        } catch (error: any) {
            if (cmd.client) cmd.client.errorHandler(error, interaction);
            else console.error(error);
        }
    },
    
    clean: async (message: Discord.Message) => {
        setTimeout(() => {
            try {
                if (message.deletable) message.delete()
            } catch (error) {
                return;
            }
        }, 20000)
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

    register(load: {clockwork?: Clockwork, filepath: string}) {
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
    async execute(message: Discord.Message, parsed: parsed) {
        try {
            let { command, suffix, params } = parsed;
            let commandGroup: Collection<string, AugurCommand>;
            if (this.has(command)) commandGroup = this;
            else if (this.aliases.has(command)) commandGroup = this.aliases;
            else return;

            this.commandCount++;
            let cmd = commandGroup.get(command);
            if (cmd?.parseParams)
                return cmd.execute(message, params);
            else
                return cmd?.execute(message, [suffix]);
        } catch (error: any) {
            return this.client.errorHandler(error, message);
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

    register(load: {interactions: AugurInteractionCommand[], file: string, filepath: string, client: Discord.Client}) {
        for (const interaction of load.interactions) {
            try {
                interaction.file = load.file;
                interaction.client = load.client
                if (this.has(interaction.id)) this.client.errorHandler(`Duplicate Interaction ID: ${interaction.id}`, `Interaction id ${interaction.id} already registered in \`${this.get(interaction.id)?.file}\`. It is being overwritten.`);
                this.set(interaction.id, interaction);
            } catch (error: any) {
                this.client.errorHandler(error, `Register interaction "${interaction.name}" in guild ${interaction.guildId} in ${load.filepath}`);
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
type Channels= {
    0: Discord.TextChannel
    1: Discord.DMChannel,
    2: Discord.VoiceChannel,
    3: Discord.PartialGroupDMChannel
    4: Discord.CategoryChannel
    5: Discord.NewsChannel
    10: Discord.PublicThreadChannel
    11: Discord.PublicThreadChannel
    12: Discord.PrivateThreadChannel
    13: Discord.StageChannel
    14: Discord.DirectoryChannel
    15: Discord.ForumChannel
}

class AugurClient extends Client {
    moduleHandler: ModuleManager
    augurOptions: AugurOptions
    errorHandler: ErrorHandler
    parse: parse
    commandExecution: commandExecution
    interactionExecution: interactionExecution
    applicationId: string
    config: BotConfig
    db: any
    constructor(config: BotConfig, options: AugurOptions = {}) {
        
        const intents = calculateIntents(config.events, config.processDMs);

        if (!options.clientOptions) options.clientOptions = {
                intents
        };
        else if (!options.clientOptions.intents) options.clientOptions.intents = intents
        
        super(options.clientOptions as Discord.ClientOptions);

        this.moduleHandler = new ModuleManager(this);

        this.augurOptions = options;
        this.config = config;
        this.db = (this.config.db?.model ? require(path.resolve((require.main ? path.dirname(require.main.filename) : process.cwd()), this.config.db.model)) : null);
        this.errorHandler = this.augurOptions.errorHandler || DEFAULTS.errorHandler;
        this.parse = this.augurOptions.parse || DEFAULTS.parse;
        this.commandExecution = this.augurOptions.commandExecution || DEFAULTS.commandExecution
        this.interactionExecution = this.augurOptions.interactionExecution || DEFAULTS.interactionExecution
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

        this.on("messageCreate", async (message) => {
            let halt = false;
            if (this.events.has("message")) {
                if (message.partial) {
                    try {
                        await message.fetch();
                    } catch (error: any) {
                        this.errorHandler(error, "Augur Fetch Partial Message Error");
                    }
                }
                for (let [file, handler] of this.events.get("message") ?? new Collection()) {
                    try {
                        halt = await handler(message);
                        if (halt) break;
                    } catch (error: any) {
                        this.errorHandler(error, message);
                        halt = true;
                        break;
                    }
                }
            }
            try {
                let parsed = await this.parse(message);
                if (parsed && !halt) this.commands.execute(message, parsed);
            } catch (error: any) {
                this.errorHandler(error, message);
            }
        });

        this.on("messageUpdate", async (old, message) => {
            if (old.content === message.content) return;
            let halt = false;
            if (this.events.has("messageUpdate")) {
                if (message.partial) {
                    try {
                        await message.fetch();
                    } catch (error: any) {
                        return this.errorHandler(error, "Augur Fetch Partial Message Update Error");
                    }
                }
                message = message as Message
                for (let [file, handler] of this.events.get("messageUpdate") ?? new Collection()) {
                    try {
                        halt = await handler(old, message);
                        if (halt) break;
                    } catch (error: any) {
                        this.errorHandler(error, message);
                        halt = true;
                        break;
                    }
                }
            }
            try {
                if (message.partial) {
                    try {
                        await message.fetch();
                    } catch (error: any) {
                        return this.errorHandler(error, "Augur Fetch Partial Message Update Error");
                    }
                }
                message = message as Discord.Message
                let parsed = await this.parse(message);
                if (parsed && !halt) this.commands.execute(message, parsed);
            } catch (error: any) {
                this.errorHandler(error, message);
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
                if (!halt) await this.interactions.get(
                    interaction.isCommand() ? interaction.commandId
                    : interaction.isAutocomplete() ? interaction.commandId
                    : interaction.customId
                )?.execute(interaction);
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
    login(token?: string) {
        return super.login(token || this.config?.token);
    }
    private getChannel: <A extends keyof Channels>(id: string, type: A, stringType: string) => Channels[A] | null = (id, type, stringType) => {
        const channel = this.channels.cache.get(id)
        if (!channel) return this.wrongTypeErr(id, stringType, "Undefined")
        if (channel.type != type) return this.wrongTypeErr(id, stringType, Discord.ChannelType[channel.type])
        return channel as Channels[typeof type]
    }
    wrongTypeErr (id: string, strType: string, expected: string) {
        if (this.config.strictTypes?.channels) throw new Error(`Expected a ${expected} channel but got a ${strType} instead. (id: ${id})`)
        else return null;
    }
    getTextChannel(id: string) {
        return this.getChannel(id, 0, "Text")
    }
    getDmChannel(id: string) {
        return this.getChannel(id, 1, "DM")
    }
    getGroupDmChannel(id: string) {
        return this.getChannel(id, 3, "Partial Group DM")
    }
    getVoiceChannel(id: string) {
        return this.getChannel(id, 2, "Voice")
    }
    getCategoryChannel(id: string) {
        return this.getChannel(id, 4, "Category")
    }
    getNewsChannel(id: string) {
        return this.getChannel(id, 5, "News")
    }
    getAnnouncementsThread(id: string) {
        return this.getChannel(id, 10, "Annoucements Thread")
    }
    getPublicThread(id: string) {
        return this.getChannel(id, 11, "Public Thread")
    }
    getPrivateThread(id: string) {
        return this.getChannel(id, 12, "Private Thread")
    }
    getStage(id: string) {
        return this.getChannel(id, 13, "Stage")
    }
    getDirectory(id: string) {
        return this.getChannel(id, 14, "Directory")
    }
    getForumChannel(id: string) {
        return this.getChannel(id, 15, "Forum")
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

    addCommand<G extends opBool, D extends opBool>(info: AugurCommandInfo<G, D>) {
        this.commands.push(new AugurCommand(info, this.client));
        return this;
    }
    
    addEvent: <K extends keyof Discord.ClientEvents>(event: K, listener: (...args: Discord.ClientEvents[K]) => Promise<any> | any) => this = (name, handler) => {
        this.events.set(name, handler);
        return this;
    }

    addInteraction<K extends keyof NoAutoComplete | undefined, G extends opBool, D extends opBool>(info: AugurInteractionCommandInfo<K, G, D>) {
        this.interactions.push(new AugurInteractionCommand(info, this.client));
        return this;
    }

    setClockwork(clockwork: Clockwork | undefined) {
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


/*
    Simplified logic for future reference
    if (undefined == G) {
        if (undefined == D) return boolean
        else {
            if (true == D) return false
            else return boolean
        }
    } else {
        if (true == D) return true
        else return boolean
    }
*/
type guildDmMessage <G extends opBool, D extends opBool> = 
    undefined extends G ? undefined extends D ? boolean :
    true extends D ? false : boolean :
    true extends G ? true : boolean

type guildDmInteraction<G extends opBool, D extends opBool> = guildDmMessage<G, D> extends true ? "cached" : Discord.CacheType

/********************
 **  COMMAND CLASS  **
 ********************/

type AugurCommandInfo<G extends opBool, D extends opBool> = {
    parseParams?: boolean
    category?: string
    name: string
    aliases?: string[]
    syntax?: string
    description?: string
    info?: string
    hidden?: boolean
    enabled?: boolean
    userPermissions?: (Discord.PermissionResolvable)[]
    permissions?: (message: Discord.Message<guildDmMessage<G,D>>) => Promise<boolean | null | undefined> | boolean | null | undefined
    options?: any
    process: (message: Discord.Message<guildDmMessage<G,D>>, ...args: string[]) => Promise<any> | any
    onlyOwner?: boolean
    onlyGuild?: G
    onlyDm?: D
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
    userPermissions: (Discord.PermissionResolvable)[]
    permissions: (message: Discord.Message) => Promise<boolean | null | undefined> | boolean | null | undefined
    options: any
    process: (message: Discord.Message, ...args: string[]) => any
    onlyOwner: boolean
    onlyGuild: boolean
    onlyDm: boolean

    constructor(info: AugurCommandInfo<any, any>, client: Discord.Client) {
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
        this.permissions = info.permissions || (() => true);
        this.userPermissions = info.userPermissions ?? [];
        this.parseParams = info.parseParams ?? false;
        this.options = info.options ?? {};
        this.process = info.process;
        this.onlyOwner = info.onlyOwner || false;
        this.onlyGuild = info.onlyGuild || false;
        this.onlyDm = info.onlyDm || false;
        this.file = "";
        this.client = client;
    }

    async execute(message: Discord.Message, args: string[]) {
        this.client.commandExecution(this, message, args)
    }
}

type DefaultInteraction<A extends keyof NoAutoComplete | undefined> = undefined extends A ? "CommandSlash" : A extends keyof NoAutoComplete ? A : "CommandSlash"

type AugurInteractionCommandInfo<K extends keyof NoAutoComplete | undefined, G extends opBool, D extends opBool> = {
    id: string
    name?: string
    guildId?: string
    syntax?: string
    description?: string
    info?: string
    hidden?: boolean
    category?: string
    enabled?: boolean
    options?: Object
    type?: K
    userPermissions?: (Discord.PermissionResolvable)[]
    permissions?: (interaction: NoAutoComplete<guildDmInteraction<G, D>>[DefaultInteraction<K>]) => Promise<boolean | null | undefined> | boolean | null | undefined
    autocomplete?: (interaction: Discord.AutocompleteInteraction<guildDmInteraction<G, D>>) => Promise<any> | any
    process: (interaction: NoAutoComplete<guildDmInteraction<G, D>>[DefaultInteraction<K>]) => Promise<any> | any
    onlyOwner?: boolean
    onlyGuild?: G
    onlyDm?: D
}

class AugurInteractionCommand {
    file: string
    id: string
    name: string
    guildId?: string
    syntax: string
    description: string
    info: string
    hidden: boolean
    category: string
    enabled: boolean
    options: Object
    userPermissions: (Discord.PermissionResolvable)[]
    permissions: (int: any) => Promise<boolean | null | undefined> | boolean | null | undefined
    process: (int: any) => Promise<any> | any
    autocomplete: (int: Discord.AutocompleteInteraction) => Promise<any> | any
    onlyOwner: boolean
    onlyGuild: boolean
    onlyDm: boolean
    client: Discord.Client
    constructor(info: AugurInteractionCommandInfo<any, any, any>, client: Discord.Client) {
        if (!info.id || !info.process) {
            throw new Error("Commands must have the `id` and `process` properties");
        }
        this.id = info.id;
        this.name = info.name ?? info.id;
        this.guildId = info.guildId;
        this.syntax = info.syntax ?? "";
        this.description = info.description ?? `${this.name} ${this.syntax}`.trim();
        this.info = info.info ?? this.description;
        this.hidden = info.hidden ?? false;
        this.category = info.category ?? "";
        this.enabled = info.enabled ?? true;
        this.options = info.options ?? {};
        this.userPermissions = info.userPermissions ?? [];
        this.permissions = info.permissions || (async () => true);
        this.process = info.process;
        this.autocomplete = info.autocomplete || (() => {})
        this.onlyOwner = info.onlyOwner || false;
        this.onlyGuild = info.onlyGuild || false;
        this.onlyDm = info.onlyDm || false;
        this.file = "";
        this.client = client;
    }

    async execute(interaction: Discord.Interaction) {
        this.client.interactionExecution(this, interaction)
    }
}

/**************
 **  EXPORTS  **
 **************/


export {
    AugurClient,
    AugurModule as Module,
    GuildInteraction,
    DEFAULTS as defaults
}
