/// <reference types="node" />
import Discord, { Collection, Client, Message } from 'discord.js';
type parsed = {
    command: string;
    suffix: string;
    params: string[];
};
type ErrorHandler = (error: Error | string, message?: Discord.Message | Discord.PartialMessage | Discord.BaseInteraction | string) => void;
type parse = (message: Discord.Message) => Promise<parsed | null>;
type commandExecution = (cmd: AugurCommand, message: Discord.Message, args: string[]) => Promise<any>;
type interactionExecution = (cmd: AugurInteractionCommand, interaction: Discord.BaseInteraction) => Promise<any>;
/** Standard configuration for the bot. Can be extended to include more properties of your choice */
type BotConfig = {
    events: (keyof Discord.ClientEvents)[];
    processDMs?: boolean;
    db: {
        model: string;
    };
    token: string;
    ownerId: string;
    applicationId?: string;
    prefix?: string;
    strictTypes?: {
        channels: boolean;
    };
};
/** Options for the client object */
type AugurOptions = {
    clientOptions?: Discord.ClientOptions;
    errorHandler?: ErrorHandler;
    parse?: parse;
    commandExecution?: commandExecution;
    interactionExecution?: interactionExecution;
    commands?: string;
};
/** Function to run on module load */
type init = (load: any) => void;
/** Function to run on module unload */
type unload = () => any;
/** Function to run a timeout on module load */
type Clockwork = () => NodeJS.Timeout;
type interactionTypes<K extends Discord.CacheType = Discord.CacheType> = {
    AutoComplete: Discord.AutocompleteInteraction<K>;
    Base: Discord.BaseInteraction<K>;
    Button: Discord.ButtonInteraction<K>;
    CommandSlash: Discord.ChatInputCommandInteraction<K>;
    CommandBase: Discord.CommandInteraction<K>;
    ContextMessage: Discord.MessageContextMenuCommandInteraction<K>;
    ContextUser: Discord.UserContextMenuCommandInteraction<K>;
    ContextBase: Discord.ContextMenuCommandInteraction<K>;
    MessageComponent: Discord.MessageComponentInteraction<K>;
    Modal: Discord.ModalSubmitInteraction<K>;
    SelectMenuChannel: Discord.ChannelSelectMenuInteraction<K>;
    SelectMenuMentionable: Discord.MentionableSelectMenuInteraction<K>;
    SelectMenuRole: Discord.RoleSelectMenuInteraction<K>;
    SelectMenuString: Discord.StringSelectMenuInteraction<K>;
    SelectMenuUser: Discord.UserSelectMenuInteraction<K>;
};
type GuildInteraction<K extends keyof interactionTypes<"cached">> = interactionTypes<"cached">[K];
declare module 'discord.js' {
    interface Client {
        prefix: string;
        errorHandler: ErrorHandler;
        parse: parse;
        commandExecution: commandExecution;
        interactionExecution: interactionExecution;
        clockwork: ClockworkManager;
        commands: CommandManager;
        events: EventManager;
        interactions: InteractionManager;
        config: BotConfig;
        applicationId: string;
        db: any;
        getTextChannel(id: string): Discord.TextChannel | null;
        getDmChannel(id: string): Discord.DMChannel | null;
        getGroupDmChannel(id: string): Discord.PartialGroupDMChannel | null;
        getVoiceChannel(id: string): Discord.VoiceChannel | null;
        getCategoryChannel(id: string): Discord.CategoryChannel | null;
        getNewsChannel(id: string): Discord.NewsChannel | null;
        getAnnouncementsThread(id: string): Discord.PublicThreadChannel | null;
        getPublicThread(id: string): Discord.PublicThreadChannel | null;
        getPrivateThread(id: string): Discord.PrivateThreadChannel | null;
        getStage(id: string): Discord.StageChannel | null;
        getDirectory(id: string): Discord.DirectoryChannel | null;
        getForumChannel(id: string): Discord.ForumChannel | null;
    }
}
/**
 ** DEFAULT FUNCTIONS*/
declare const DEFAULTS: {
    errorHandler: (error: Error | string, message?: any) => void;
    parse: (message: Discord.Message) => Promise<{
        command: string;
        suffix: string;
        params: string[];
    } | null>;
    commandExecution: (cmd: AugurCommand, message: Discord.Message, args: string[]) => Promise<void>;
    interactionExecution: (cmd: AugurInteractionCommand, interaction: Discord.BaseInteraction) => Promise<any>;
    clean: (message: Discord.Message) => Promise<void>;
};
/***************
 **  MANAGERS  **
 ***************/
declare class ClockworkManager extends Collection<string, NodeJS.Timeout> {
    client: Discord.Client;
    constructor(client: Discord.Client);
    register(load: {
        clockwork: Clockwork;
        filepath: string;
    }): this;
    unload(filepath: string): this;
}
declare class CommandManager extends Collection<string, AugurCommand> {
    client: Discord.Client;
    aliases: Collection<string, AugurCommand>;
    commandCount: number;
    constructor(client: Discord.Client);
    execute(message: Discord.Message, parsed: parsed): Promise<void>;
    register(load: {
        file: string;
        filepath: string;
        client: Discord.Client;
        commands: [AugurCommand];
    }): this;
}
declare class EventManager extends Collection<string, Collection<string, Function>> {
    client: Discord.Client;
    constructor(client: Discord.Client);
    register(load: {
        events: Collection<string, Function>;
        file: string;
    }): this;
}
declare class InteractionManager extends Collection<string, AugurInteractionCommand> {
    client: Discord.Client;
    constructor(client: Discord.Client);
    _call(url: string, data?: any, method?: string): Promise<any>;
    register(load: {
        interactions: AugurInteractionCommand[];
        file: string;
        filepath: string;
        client: Discord.Client;
    }): this;
    /*******************************
     **  GLOBAL COMMAND ENDPOINTS  **
     *******************************/
    getGlobalCommands(commandId: string): Promise<any>;
    createGlobalCommand(data: Discord.ApplicationCommandData): Promise<any>;
    editGlobalCommand(commandId: string, data: Discord.ApplicationCommandData): Promise<any>;
    deleteGlobalCommand(commandId: string): Promise<any>;
    /******************************
     **  GUILD COMMAND ENDPOINTS  **
     ******************************/
    getGuildCommands(guildId: string, commandId: string): Promise<any>;
    createGuildCommand(guildId: string, data: Discord.ApplicationCommandData): Promise<any>;
    editGuildCommand(guildId: string, commandId: string, data: Discord.ApplicationCommandData): Promise<any>;
    deleteGuildCommand(guildId: string, commandId: string): Promise<any>;
}
declare class ModuleManager {
    client: Discord.Client;
    clockwork: ClockworkManager;
    commands: CommandManager;
    events: EventManager;
    interactions: InteractionManager;
    unloads: Map<string, Function>;
    constructor(client: Discord.Client);
    register(file: string, data?: init): this;
    reload(file: string): this;
    unload(file: string): any;
    unloadAll(): this;
}
declare class AugurClient extends Client {
    moduleHandler: ModuleManager;
    augurOptions: AugurOptions;
    errorHandler: ErrorHandler;
    parse: parse;
    commandExecution: commandExecution;
    interactionExecution: interactionExecution;
    applicationId: string;
    config: BotConfig;
    db: any;
    constructor(config: BotConfig, options?: AugurOptions);
    destroy(): Promise<void>;
    login(token: string): Promise<string>;
    private getChannel;
    wrongTypeErr(id: string, strType: string, expected: string): null;
    getTextChannel(id: string): Discord.TextChannel | null;
    getDmChannel(id: string): Discord.DMChannel | null;
    getGroupDmChannel(id: string): Discord.PartialGroupDMChannel | null;
    getVoiceChannel(id: string): Discord.VoiceChannel | null;
    getCategoryChannel(id: string): Discord.CategoryChannel | null;
    getNewsChannel(id: string): Discord.NewsChannel | null;
    getAnnouncementsThread(id: string): Discord.PublicThreadChannel<boolean> | null;
    getPublicThread(id: string): Discord.PublicThreadChannel<boolean> | null;
    getPrivateThread(id: string): Discord.PrivateThreadChannel | null;
    getStage(id: string): Discord.StageChannel | null;
    getDirectory(id: string): Discord.DirectoryChannel | null;
    getForumChannel(id: string): Discord.ForumChannel | null;
}
/***********************
 **  MODULE CONTAINER  **
 ***********************/
declare class AugurModule {
    commands: AugurCommand[];
    interactions: AugurInteractionCommand[];
    events: Collection<string, Function>;
    config: BotConfig | {};
    client: Discord.Client;
    clockwork?: Clockwork;
    init?: init;
    unload?: unload;
    constructor();
    addCommand(info: AugurCommandInfo): this;
    addEvent: <K extends keyof Discord.ClientEvents>(event: K, listener: (...args: Discord.ClientEvents[K]) => Promise<any> | any) => this;
    addInteraction<K extends keyof interactionTypes | undefined>(info: AugurInteractionCommandInfo<K>): this;
    setClockwork(clockwork: Clockwork): this;
    setInit(init: init): this;
    setUnload(unload: unload): this;
}
/********************
 **  COMMAND CLASS  **
 ********************/
type AugurCommandInfo = {
    parseParams?: boolean;
    category?: string;
    name: string;
    aliases?: string[];
    syntax?: string;
    description?: string;
    info?: string;
    hidden?: boolean;
    enabled?: boolean;
    userPermissions?: (Discord.PermissionResolvable)[];
    permissions?: (message: Discord.Message) => Promise<any> | any;
    options?: any;
    process: (message: Discord.Message, ...args: string[]) => Promise<any> | any;
    onlyOwner?: boolean;
    onlyGuild?: boolean;
    onlyDm?: boolean;
};
declare class AugurCommand {
    file: string;
    client: Discord.Client;
    parseParams: boolean;
    category: string;
    name: string;
    aliases: string[];
    syntax: string;
    description: string;
    info: string;
    hidden: boolean;
    enabled: boolean;
    userPermissions: (Discord.PermissionResolvable)[];
    permissions: (message: Discord.Message) => Promise<boolean>;
    options: any;
    process: (message: Discord.Message, ...args: string[]) => Promise<void>;
    onlyOwner: boolean;
    onlyGuild: boolean;
    onlyDm: boolean;
    constructor(info: AugurCommandInfo, client: Discord.Client);
    execute(message: Discord.Message, args: string[]): Promise<void>;
}
type DefaultInteraction<A> = undefined extends A ? "CommandSlash" : A extends keyof interactionTypes ? A : "CommandSlash";
type AugurInteractionCommandInfo<K extends keyof interactionTypes | undefined> = {
    id: string;
    name?: string;
    guild?: Discord.Guild;
    syntax?: string;
    description?: string;
    info?: string;
    hidden?: boolean;
    category?: string;
    enabled?: boolean;
    options?: Object;
    type?: K;
    userPermissions?: (Discord.PermissionResolvable)[];
    permissions?: (interaction: interactionTypes[DefaultInteraction<K>]) => Promise<boolean> | boolean;
    process: (interaction: interactionTypes[DefaultInteraction<K>]) => Promise<any> | any;
    onlyOwner?: boolean;
    onlyGuild?: boolean;
    onlyDm?: boolean;
};
declare class AugurInteractionCommand {
    file: string;
    id: string;
    name: string;
    guild?: Discord.Guild;
    syntax: string;
    description: string;
    info: string;
    hidden: boolean;
    category: string;
    enabled: boolean;
    options: Object;
    userPermissions: (Discord.PermissionResolvable)[];
    permissions: (int: any) => Promise<boolean> | boolean;
    process: (int: any) => Promise<any> | any;
    onlyOwner: boolean;
    onlyGuild: boolean;
    onlyDm: boolean;
    client: Discord.Client;
    constructor(info: AugurInteractionCommandInfo<any>, client: Discord.Client);
    execute(interaction: Discord.BaseInteraction): Promise<void>;
}
/**************
 **  EXPORTS  **
 **************/
export { AugurClient, AugurModule as Module, GuildInteraction, DEFAULTS as defaults };
