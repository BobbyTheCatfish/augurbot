"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaults = exports.ModuleManager = exports.InteractionManager = exports.EventManager = exports.CommandManager = exports.ClockworkManager = exports.AugurModule = exports.Module = exports.AugurInteractionCommand = exports.AugurCommand = exports.AugurClient = void 0;
const fs_1 = __importDefault(require("fs"));
const discord_js_1 = __importStar(require("discord.js"));
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const intents_js_1 = __importDefault(require("./intents.js"));
/**
 ** DEFAULT FUNCTIONS*/
const DEFAULTS = {
    errorHandler: (error, message) => {
        console.error(Date());
        if (message instanceof discord_js_1.default.Message) {
            console.error(`${message.author.username} in ${(message.guild ? (`${message.guild.name} > ${message.channel.name}`) : "DM")}: ${message.cleanContent}`);
        }
        else if (message) {
            console.error(message);
        }
        console.error(error);
    },
    parse: (message) => __awaiter(void 0, void 0, void 0, function* () {
        let content = message.content;
        let setPrefix = message.client.prefix || "!";
        if (message.author.bot)
            return null;
        for (let prefix of [setPrefix, `<@${message.client.user.id}>`, `<@!${message.client.user.id}>`]) {
            if (!content.startsWith(prefix))
                continue;
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
    }),
    commandExecution: (cmd, message, args) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            let reply = "";
            /**Enabled*/ if (!cmd.enabled)
                return;
            /**Only Owner*/ else if (cmd.onlyOwner && message.author.id != message.client.config.ownerId)
                return;
            /**Only Guild*/ else if (cmd.onlyGuild && !message.guild)
                reply = `That command can only be used in a server.`;
            /**Only DM*/ else if (cmd.onlyDm && message.guild)
                reply = `That command can only be used in a DM`;
            /**userPermissions*/ else if (((_a = cmd.userPermissions) === null || _a === void 0 ? void 0 : _a.length) > 0 && (message.guild ? !((_b = message.member) === null || _b === void 0 ? void 0 : _b.permissions.has(cmd.userPermissions, true)) : true))
                reply = `You don't have permission to use that command!`;
            /**permissions*/ else if (!(yield cmd.permissions(message)))
                reply = `You don't have permission to use that command!`;
            if (reply)
                return message.reply(reply).then(DEFAULTS.clean);
            else
                return yield cmd.process(message, ...args);
        }
        catch (error) {
            if (cmd.client)
                cmd.client.errorHandler(error, message);
            else
                console.error(error);
        }
    }),
    interactionExecution: (cmd, interaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _c, _d;
        try {
            let reply = "";
            /**Enabled*/ if (!cmd.enabled)
                return;
            /**Only Owner*/ else if (cmd.onlyOwner && ((_c = interaction.member) === null || _c === void 0 ? void 0 : _c.user.id) != cmd.client.config.ownerId)
                return;
            /**Only Guild*/ else if (cmd.onlyGuild && !interaction.guild)
                reply = `That command can only be used in a server.`;
            /**Only DM*/ else if (cmd.onlyDm && interaction.guild)
                reply = `That command can only be used in a DM`;
            /**userPermissions*/ else if (cmd.userPermissions.length > 0 && (interaction.guild ? !((_d = interaction.member) === null || _d === void 0 ? void 0 : _d.permissions).has(cmd.userPermissions) : true))
                reply = `You don't have permission to use that command!`;
            /**permissions*/ else if (!(yield cmd.validation(interaction)))
                reply = `You don't have permission to use that command!`;
            if (reply && interaction.isRepliable()) {
                if (!interaction.replied)
                    interaction.reply({ content: reply, ephemeral: true });
                else
                    interaction.editReply({ content: reply });
            }
            else
                return yield cmd.process(interaction);
        }
        catch (error) {
            if (cmd.client)
                cmd.client.errorHandler(error, interaction);
            else
                console.error(error);
        }
    }),
    clean: (message) => __awaiter(void 0, void 0, void 0, function* () {
        setTimeout(() => {
            try {
                if (message.deletable)
                    message.delete();
            }
            catch (error) {
                return;
            }
        }, 20000);
    })
};
exports.defaults = DEFAULTS;
/***************
 **  MANAGERS  **
 ***************/
class ClockworkManager extends discord_js_1.Collection {
    constructor(client) {
        super();
        this.client = client;
    }
    register(load) {
        if (load.clockwork)
            this.set(load.filepath, load.clockwork());
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
exports.ClockworkManager = ClockworkManager;
class CommandManager extends discord_js_1.Collection {
    constructor(client) {
        super();
        this.client = client;
        this.aliases = new discord_js_1.Collection();
        this.commandCount = 0;
    }
    execute(message, parsed) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { command, suffix, params } = parsed;
                let commandGroup;
                if (this.has(command))
                    commandGroup = this;
                else if (this.aliases.has(command))
                    commandGroup = this.aliases;
                else
                    return;
                this.commandCount++;
                let cmd = commandGroup.get(command);
                if (cmd === null || cmd === void 0 ? void 0 : cmd.parseParams)
                    return cmd.execute(message, params);
                else
                    return cmd === null || cmd === void 0 ? void 0 : cmd.execute(message, [suffix]);
            }
            catch (error) {
                return this.client.errorHandler(error, message);
            }
        });
    }
    register(load) {
        for (const command of load.commands) {
            try {
                command.file = load.file;
                command.client = load.client;
                if (!command.category)
                    command.category = path_1.default.basename(command.file, ".js");
                if (!this.has(command.name.toLowerCase()))
                    this.set(command.name.toLowerCase(), command);
                if (command.aliases.length > 0) {
                    for (let alias of command.aliases.filter(a => !this.aliases.has(a.toLowerCase())))
                        this.aliases.set(alias.toLowerCase(), command);
                }
            }
            catch (error) {
                this.client.errorHandler(error, `Register command "${command.name}" in ${load.filepath}`);
            }
        }
        return this;
    }
}
exports.CommandManager = CommandManager;
class EventManager extends discord_js_1.Collection {
    constructor(client) {
        super();
        this.client = client;
    }
    register(load) {
        var _a, _b;
        if (((_a = load.events) === null || _a === void 0 ? void 0 : _a.size) > 0) {
            for (const [event, handler] of load.events) {
                if (!this.has(event))
                    this.set(event, new discord_js_1.Collection([
                        [load.file, handler]
                    ]));
                else
                    (_b = this.get(event)) === null || _b === void 0 ? void 0 : _b.set(load.file, handler);
            }
        }
        return this;
    }
}
exports.EventManager = EventManager;
class InteractionManager extends discord_js_1.Collection {
    constructor(client) {
        super();
        this.client = client;
    }
    _call(url, data, method = "get") {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield (0, axios_1.default)({
                url,
                baseURL: `https://discord.com/api/v10/applications/${this.client.applicationId}`,
                method,
                headers: {
                    "Authorization": `Bot ${this.client.token}`
                },
                data
            })).data;
        });
    }
    register(load) {
        var _a;
        for (const interaction of load.interactions) {
            try {
                interaction.file = load.file;
                if (this.has(interaction.id))
                    this.client.errorHandler(`Duplicate Interaction ID: ${interaction.id}`, `Interaction id ${interaction.id} already registered in \`${(_a = this.get(interaction.id)) === null || _a === void 0 ? void 0 : _a.file}\`. It is being overwritten.`);
                this.set(interaction.id, interaction);
            }
            catch (error) {
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
exports.InteractionManager = InteractionManager;
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
        var _a;
        if (file) {
            let filepath = path_1.default.resolve(file);
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
                (_a = load.init) === null || _a === void 0 ? void 0 : _a.call(load, data);
                // REGISTER UNLOAD FUNCTION
                if (load.unload)
                    this.unloads.set(filepath, load.unload);
            }
            catch (error) {
                this.client.errorHandler(error, `Register: ${filepath}`);
            }
        }
        return this;
    }
    reload(file) {
        if (file) {
            let filepath = path_1.default.resolve(file);
            try {
                let unloadData = this.unload(filepath);
                this.register(filepath, unloadData);
            }
            catch (error) {
                this.client.errorHandler(error, `Reload: ${filepath}`);
            }
        }
        return this;
    }
    unload(file) {
        var _a;
        if (file) {
            let filepath = path_1.default.resolve(file);
            try {
                // Clear Clockwork
                this.clockwork.unload(filepath);
                // Clear Event Handlers
                for (let [event, handlers] of this.events) {
                    handlers.delete(filepath);
                }
                // Clear Interaction Handlers
                for (let [interactionId, interaction] of this.interactions) {
                    if (interaction.file == filepath)
                        this.interactions.delete(interactionId);
                }
                // Unload
                let unloadData;
                if (this.unloads.has(filepath)) {
                    unloadData = ((_a = this.unloads.get(filepath)) !== null && _a !== void 0 ? _a : (() => { }))();
                    this.unloads.delete(filepath);
                }
                // Clear Commands and Aliases
                for (let [name, command] of this.commands) {
                    if (command.file == filepath)
                        this.commands.delete(name);
                }
                for (let [alias, command] of this.commands.aliases) {
                    if (command.file == filepath)
                        this.commands.aliases.delete(alias);
                }
                // Clear Require Cache
                delete require.cache[require.resolve(filepath)];
                return unloadData;
            }
            catch (error) {
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
            }
            catch (error) {
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
exports.ModuleManager = ModuleManager;
/*******************
 **  AUGUR CLIENT  **
 *******************/
class AugurClient extends discord_js_1.Client {
    constructor(config, options = {}) {
        var _a, _b, _c;
        const intents = (0, intents_js_1.default)(config.events, config.processDMs);
        if (!options.clientOptions)
            options.clientOptions = {
                intents
            };
        else if (!options.clientOptions.intents)
            options.clientOptions.intents = intents;
        super(options.clientOptions);
        this.moduleHandler = new ModuleManager(this);
        this.augurOptions = options;
        this.config = config;
        this.db = (((_a = this.config.db) === null || _a === void 0 ? void 0 : _a.model) ? require(path_1.default.resolve((require.main ? path_1.default.dirname(require.main.filename) : process.cwd()), this.config.db.model)) : null);
        this.errorHandler = this.augurOptions.errorHandler || DEFAULTS.errorHandler;
        this.parse = this.augurOptions.parse || DEFAULTS.parse;
        this.commandExecution = this.augurOptions.commandExecution || DEFAULTS.commandExecution;
        this.interactionExecution = this.augurOptions.interactionExecution || DEFAULTS.interactionExecution;
        this.utils = this.augurOptions.utils;
        this.applicationId = "";
        // PRE-LOAD COMMANDS
        if ((_b = this.augurOptions) === null || _b === void 0 ? void 0 : _b.commands) {
            let commandPath = path_1.default.resolve(require.main ? path_1.default.dirname(require.main.filename) : process.cwd(), this.augurOptions.commands);
            try {
                let commandFiles = fs_1.default.readdirSync(commandPath).filter(f => f.endsWith(".js"));
                for (let command of commandFiles) {
                    try {
                        this.moduleHandler.register(path_1.default.resolve(commandPath, command));
                    }
                    catch (error) {
                        this.errorHandler(error, `Error loading Augur Module ${command}`);
                    }
                }
            }
            catch (error) {
                this.errorHandler(error, `Error loading module names from ${commandPath}`);
            }
        }
        // SET EVENT HANDLERS
        this.once("ready", () => __awaiter(this, void 0, void 0, function* () {
            var _d, _e, _f;
            this.applicationId = (_f = (_e = (yield ((_d = this.application) === null || _d === void 0 ? void 0 : _d.fetch()))) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : "";
        }));
        this.on("ready", () => __awaiter(this, void 0, void 0, function* () {
            var _g, _h;
            console.log(`${(_g = this.user) === null || _g === void 0 ? void 0 : _g.username} ${(this.shard ? ` Shard ${this.shard.ids}` : "")} ready at: ${Date()}`);
            console.log(`Listening to ${this.channels.cache.size} channels in ${this.guilds.cache.size} servers.`);
            if (this.events.has("ready")) {
                for (let [file, handler] of (_h = this.events.get("ready")) !== null && _h !== void 0 ? _h : new discord_js_1.Collection()) {
                    try {
                        if (yield handler())
                            break;
                    }
                    catch (error) {
                        this.errorHandler(error, `Ready Handler: ${file}`);
                    }
                }
            }
        }));
        this.on("messageCreate", (message) => __awaiter(this, void 0, void 0, function* () {
            var _j;
            let halt = false;
            if (this.events.has("message")) {
                if (message.partial) {
                    try {
                        yield message.fetch();
                    }
                    catch (error) {
                        this.errorHandler(error, "Augur Fetch Partial Message Error");
                    }
                }
                for (let [file, handler] of (_j = this.events.get("message")) !== null && _j !== void 0 ? _j : new discord_js_1.Collection()) {
                    try {
                        halt = yield handler(message);
                        if (halt)
                            break;
                    }
                    catch (error) {
                        this.errorHandler(error, message);
                        halt = true;
                        break;
                    }
                }
            }
            try {
                let parsed = yield this.parse(message);
                if (parsed && !halt)
                    this.commands.execute(message, parsed);
            }
            catch (error) {
                this.errorHandler(error, message);
            }
        }));
        this.on("messageUpdate", (old, message) => __awaiter(this, void 0, void 0, function* () {
            var _k;
            if (old.content === message.content)
                return;
            let halt = false;
            if (this.events.has("messageUpdate")) {
                if (message.partial) {
                    try {
                        yield message.fetch();
                    }
                    catch (error) {
                        return this.errorHandler(error, "Augur Fetch Partial Message Update Error");
                    }
                }
                message = message;
                for (let [file, handler] of (_k = this.events.get("messageUpdate")) !== null && _k !== void 0 ? _k : new discord_js_1.Collection()) {
                    try {
                        halt = yield handler(old, message);
                        if (halt)
                            break;
                    }
                    catch (error) {
                        this.errorHandler(error, message);
                        halt = true;
                        break;
                    }
                }
            }
            try {
                if (message.partial) {
                    try {
                        yield message.fetch();
                    }
                    catch (error) {
                        return this.errorHandler(error, "Augur Fetch Partial Message Update Error");
                    }
                }
                message = message;
                let parsed = yield this.parse(message);
                if (parsed && !halt)
                    this.commands.execute(message, parsed);
            }
            catch (error) {
                this.errorHandler(error, message);
            }
        }));
        this.on("interactionCreate", (interaction) => __awaiter(this, void 0, void 0, function* () {
            var _l, _m;
            let halt = false;
            if (this.events.has("interactionCreate")) {
                for (let [file, handler] of (_l = this.events.get("interactionCreate")) !== null && _l !== void 0 ? _l : new discord_js_1.Collection()) {
                    try {
                        halt = yield handler(interaction);
                        if (halt)
                            break;
                    }
                    catch (error) {
                        this.errorHandler(error, `interactionCreate Handler: ${file}`);
                        break;
                    }
                }
            }
            try {
                if (!halt)
                    yield ((_m = this.interactions.get(interaction.id)) === null || _m === void 0 ? void 0 : _m.execute(interaction));
            }
            catch (error) {
                this.errorHandler(error, `Interaction Processing: ${interaction.id}`);
            }
        }));
        if (this.config.events.includes("messageReactionAdd")) {
            this.on("messageReactionAdd", (reaction, user) => __awaiter(this, void 0, void 0, function* () {
                var _o, _p, _q, _r;
                if (((_p = (_o = this.events.get("messageReactionAdd")) === null || _o === void 0 ? void 0 : _o.size) !== null && _p !== void 0 ? _p : 0) > 0) {
                    if (reaction.partial) {
                        try {
                            yield reaction.fetch();
                        }
                        catch (error) {
                            this.errorHandler(error, "Augur Fetch Partial Message Reaction Error");
                        }
                    }
                    if ((_q = reaction.message) === null || _q === void 0 ? void 0 : _q.partial) {
                        try {
                            yield reaction.message.fetch();
                        }
                        catch (error) {
                            this.errorHandler(error, "Augur Fetch Partial Reaction.Message Error");
                        }
                    }
                    for (let [file, handler] of (_r = this.events.get("messageReactionAdd")) !== null && _r !== void 0 ? _r : new discord_js_1.Collection()) {
                        try {
                            if (yield handler(reaction, user))
                                break;
                        }
                        catch (error) {
                            this.errorHandler(error, `messageReactionAdd Handler: ${file}`);
                            break;
                        }
                    }
                }
            }));
        }
        let events = (((_c = this.config) === null || _c === void 0 ? void 0 : _c.events) || []).filter(event => !["message", "messageUpdate", "interactionCreate", "messageReactionAdd", "ready"].includes(event));
        for (let event of events) {
            this.on(event, (...args) => __awaiter(this, void 0, void 0, function* () {
                var _s, _t, _u;
                if (((_t = (_s = this.events.get(event)) === null || _s === void 0 ? void 0 : _s.size) !== null && _t !== void 0 ? _t : 0) > 0) {
                    for (let [file, handler] of (_u = this.events.get(event)) !== null && _u !== void 0 ? _u : new discord_js_1.Collection()) {
                        try {
                            if (yield handler(...args))
                                break;
                        }
                        catch (error) {
                            this.errorHandler(error, `${event} Handler: ${file}`);
                            break;
                        }
                    }
                }
            }));
        }
    }
    destroy() {
        try {
            this.moduleHandler.unloadAll();
        }
        catch (error) {
            this.errorHandler(error, "Unload prior to destroying client.");
        }
        return super.destroy();
    }
    login(token) {
        var _a;
        return super.login(token || ((_a = this.config) === null || _a === void 0 ? void 0 : _a.token));
    }
}
exports.AugurClient = AugurClient;
/***********************
 **  MODULE CONTAINER  **
 ***********************/
class AugurModule {
    constructor() {
        this.addEvent = (name, handler) => {
            this.events.set(name, handler);
            return this;
        };
        this.commands = [];
        this.interactions = [];
        this.events = new discord_js_1.Collection();
        this.config = {};
    }
    addCommand(info) {
        this.commands.push(new AugurCommand(info, this.client));
        return this;
    }
    addInteraction(info) {
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
exports.Module = AugurModule;
exports.AugurModule = AugurModule;
class AugurCommand {
    constructor(info, client) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (!info.name || !info.process) {
            throw new Error("Commands must have the `name` and `process` properties");
        }
        this.name = info.name;
        this.aliases = (_a = info.aliases) !== null && _a !== void 0 ? _a : [];
        this.syntax = (_b = info.syntax) !== null && _b !== void 0 ? _b : "";
        this.description = (_c = info.description) !== null && _c !== void 0 ? _c : `${this.name} ${this.syntax}`.trim();
        this.info = (_d = info.info) !== null && _d !== void 0 ? _d : this.description;
        this.hidden = (_e = info.hidden) !== null && _e !== void 0 ? _e : false;
        this.category = (_f = info.category) !== null && _f !== void 0 ? _f : "General";
        this.enabled = (_g = info.enabled) !== null && _g !== void 0 ? _g : true;
        this.permissions = info.permissions || ((message) => __awaiter(this, void 0, void 0, function* () { return true; }));
        this.userPermissions = info.userPermissions;
        this.parseParams = (_h = info.parseParams) !== null && _h !== void 0 ? _h : false;
        this.options = (_j = info.options) !== null && _j !== void 0 ? _j : {};
        this.process = info.process;
        this.onlyOwner = info.onlyOwner || false;
        this.onlyGuild = info.onlyGuild || false;
        this.onlyDm = info.onlyDm || false;
        this.file = "";
        this.client = client;
    }
    execute(message, args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.client.commandExecution(this, message, args);
        });
    }
}
exports.AugurCommand = AugurCommand;
class AugurInteractionCommand {
    constructor(info, client) {
        var _a, _b, _c, _d, _e, _f;
        if (!info.id || !info.process) {
            throw new Error("Commands must have the `id` and `process` properties");
        }
        this.id = info.id;
        this.name = info.name;
        this.syntax = (_a = info.syntax) !== null && _a !== void 0 ? _a : "";
        this.description = (_b = info.description) !== null && _b !== void 0 ? _b : `${this.name} ${this.syntax}`.trim();
        this.info = (_c = info.info) !== null && _c !== void 0 ? _c : this.description;
        this.hidden = (_d = info.hidden) !== null && _d !== void 0 ? _d : false;
        this.category = info.category;
        this.enabled = (_e = info.enabled) !== null && _e !== void 0 ? _e : true;
        this.options = (_f = info.options) !== null && _f !== void 0 ? _f : {};
        this.userPermissions = info.userPermissions;
        this.validation = info.validation || (() => __awaiter(this, void 0, void 0, function* () { return true; }));
        this.process = info.process;
        this.onlyOwner = info.onlyOwner || false;
        this.onlyGuild = info.onlyGuild || false;
        this.onlyDm = info.onlyDm || false;
        this.file = "";
        this.client = client;
    }
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.client.interactionExecution(this, interaction);
        });
    }
}
exports.AugurInteractionCommand = AugurInteractionCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVndXJib3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9hdWd1cmJvdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDRDQUFtQjtBQUNuQix5REFJbUI7QUFDbkIsa0RBQXlCO0FBQ3pCLGdEQUF1QjtBQU92Qiw4REFBMkM7QUF1RDNDO3VCQUN1QjtBQUV2QixNQUFNLFFBQVEsR0FBRztJQUNiLFlBQVksRUFBRSxDQUFDLEtBQXFCLEVBQUUsT0FBYSxFQUFFLEVBQUU7UUFDbkQsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3RCLElBQUksT0FBTyxZQUFZLG9CQUFPLENBQUMsT0FBTyxFQUFFO1lBQ3BDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTyxPQUFPLENBQUMsT0FBZ0MsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztTQUNyTDthQUFNLElBQUksT0FBTyxFQUFFO1lBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDMUI7UUFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxLQUFLLEVBQUUsQ0FBTyxPQUF3QixFQUFFLEVBQUU7UUFDdEMsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUM5QixJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUE7UUFDNUMsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLEdB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