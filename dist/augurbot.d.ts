/// <reference types="node" />
import Discord, { Collection, Client, Message } from 'discord.js';
type parsed = {
    command: string;
    suffix: string;
    params: string[];
};
type ErrorHandler = (error: Error | string, message?: Discord.Message | Discord.BaseInteraction | string | Discord.PartialMessage) => void;
type parse = (message: Discord.Message) => Promise<parsed | null>;
type commandExecution = (cmd: AugurCommand, message: Discord.Message, args: string[]) => Promise<any>;
type interactionExecution = (cmd: AugurInteractionCommand, interaction: Discord.BaseInteraction) => Promise<any>;
/** Standard configuration for the bot. Can be extended to include more properties of your choice */
type BotConfig = {
    events: (keyof Discord.ClientEvents)[];
    processDMs: boolean;
    db: {
        model: string;
    };
    token: string;
    ownerId: string;
    applicationId?: string;
    prefix?: string;
};
/** Options for the client object */
type AugurOptions = {
    clientOptions?: Discord.ClientOptions;
    errorHandler?: ErrorHandler;
    parse?: parse;
    commandExecution?: commandExecution;
    interactionExecution?: interactionExecution;
    utils?: any;
    commands?: string;
};
/** Function to run on module load */
type init = (load: any) => void;
/** Function to run on module unload */
type unload = () => any;
/** Function to run a timeout on module load */
type Clockwork = () => NodeJS.Timeout;
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
        db: any;
        applicationId: string;
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
    interactionExecution: (cmd: AugurInteractionCommand, interaction: Discord.BaseInteraction) => Promise<void>;
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
/*******************
 **  AUGUR CLIENT  **
 *******************/
declare class AugurClient extends Client {
    moduleHandler: ModuleManager;
    augurOptions: AugurOptions;
    errorHandler: ErrorHandler;
    parse: parse;
    commandExecution: commandExecution;
    interactionExecution: interactionExecution;
    utils: any;
    applicationId: string;
    config: BotConfig;
    constructor(config: BotConfig, options?: AugurOptions);
    destroy(): Promise<void>;
    login(token: string): Promise<string>;
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
    addEvent: <K extends keyof Discord.ClientEvents>(event: K, listener: (...args: Discord.ClientEvents[K]) => Promise<void>) => this;
    addInteraction(info: AugurInteractionCommandInfo): this;
    setClockwork(clockwork: Clockwork): this;
    setInit(init: init): this;
    setUnload(unload: unload): this;
}
/********************
 **  COMMAND CLASS  **
 ********************/
type AugurCommandInfo = {
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
    options: Object;
    process: (message: Discord.Message, ...args: string[]) => Promise<void>;
    onlyOwner: boolean;
    onlyGuild: boolean;
    onlyDm: boolean;
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
    options: Object;
    process: (message: Discord.Message, ...args: string[]) => Promise<void>;
    onlyOwner: boolean;
    onlyGuild: boolean;
    onlyDm: boolean;
    constructor(info: AugurCommandInfo, client: Discord.Client);
    execute(message: Discord.Message, args: string[]): Promise<void>;
}
type AugurInteractionCommandInfo = {
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
    validation: (interaction: Discord.BaseInteraction) => Promise<boolean>;
    process: (interaction: Discord.BaseInteraction) => Promise<void>;
    onlyOwner: boolean;
    onlyGuild: boolean;
    onlyDm: boolean;
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
    validation: (int: Discord.BaseInteraction) => Promise<boolean>;
    process: (int: Discord.BaseInteraction) => Promise<void>;
    onlyOwner: boolean;
    onlyGuild: boolean;
    onlyDm: boolean;
    client: Discord.Client;
    constructor(info: AugurInteractionCommandInfo, client: Discord.Client);
    execute(interaction: Discord.BaseInteraction): Promise<void>;
}
/**************
 **  EXPORTS  **
 **************/
export { AugurClient, AugurCommand, AugurInteractionCommand, AugurModule as Module, AugurModule, ClockworkManager, CommandManager, EventManager, InteractionManager, ModuleManager, DEFAULTS as defaults };
