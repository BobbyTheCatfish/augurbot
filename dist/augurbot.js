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
exports.ModuleManager = exports.InteractionManager = exports.EventManager = exports.CommandManager = exports.ClockworkManager = exports.Module = exports.AugurInteractionCommand = exports.AugurCommand = exports.AugurClient = void 0;
const fs_1 = __importDefault(require("fs"));
const discord_js_1 = __importStar(require("discord.js"));
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const intents_js_1 = __importDefault(require("./intents.js"));
/************************
 **  DEFAULT FUNCTIONS  **
 ************************/
const DEFAULTS = {
    errorHandler: (error, msg) => {
        console.error(Date());
        if (msg instanceof discord_js_1.default.Message) {
            console.error(`${msg.author.username} in ${(msg.guild ? (`${msg.guild.name} > ${msg.channel.name}`) : "DM")}: ${msg.cleanContent}`);
        }
        else if (msg) {
            console.error(msg);
        }
        console.error(error);
    },
    parse: (msg) => {
        let content = msg.content;
        let setPrefix = msg.client.prefix || "!";
        if (msg.author.bot)
            return null;
        for (let prefix of [setPrefix, `<@${msg.client.user.id}>`, `<@!${msg.client.user.id}>`]) {
            if (!content.startsWith(prefix))
                continue;
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
    execute(msg, parsed) {
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
                    return cmd.execute(msg, params);
                else
                    return cmd === null || cmd === void 0 ? void 0 : cmd.execute(msg, [suffix]);
            }
            catch (error) {
                return this.client.errorHandler(error, msg);
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
        this.on("messageCreate", (msg) => __awaiter(this, void 0, void 0, function* () {
            var _j;
            let halt = false;
            if (this.events.has("message")) {
                if (msg.partial) {
                    try {
                        yield msg.fetch();
                    }
                    catch (error) {
                        this.errorHandler(error, "Augur Fetch Partial Message Error");
                    }
                }
                for (let [file, handler] of (_j = this.events.get("message")) !== null && _j !== void 0 ? _j : new discord_js_1.Collection()) {
                    try {
                        halt = yield handler(msg);
                        if (halt)
                            break;
                    }
                    catch (error) {
                        this.errorHandler(error, msg);
                        halt = true;
                        break;
                    }
                }
            }
            try {
                let parsed = this.parse(msg);
                if (parsed && !halt)
                    this.commands.execute(msg, parsed);
            }
            catch (error) {
                this.errorHandler(error, msg);
            }
        }));
        this.on("messageUpdate", (old, msg) => __awaiter(this, void 0, void 0, function* () {
            var _k;
            if (old.content === msg.content)
                return;
            let halt = false;
            if (this.events.has("messageUpdate")) {
                if (msg.partial) {
                    try {
                        yield msg.fetch();
                    }
                    catch (error) {
                        return this.errorHandler(error, "Augur Fetch Partial Message Update Error");
                    }
                }
                msg = msg;
                for (let [file, handler] of (_k = this.events.get("messageUpdate")) !== null && _k !== void 0 ? _k : new discord_js_1.Collection()) {
                    try {
                        halt = yield handler(old, msg);
                        if (halt)
                            break;
                    }
                    catch (error) {
                        this.errorHandler(error, msg);
                        halt = true;
                        break;
                    }
                }
            }
            try {
                if (msg.partial) {
                    try {
                        yield msg.fetch();
                    }
                    catch (error) {
                        return this.errorHandler(error, "Augur Fetch Partial Message Update Error");
                    }
                }
                msg = msg;
                let parsed = this.parse(msg);
                if (parsed && !halt)
                    this.commands.execute(msg, parsed);
            }
            catch (error) {
                this.errorHandler(error, msg);
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
        this.commands = [];
        this.interactions = [];
        this.events = new discord_js_1.Collection();
        this.config = {};
    }
    addCommand(info) {
        this.commands.push(new AugurCommand(info, this.client));
        return this;
    }
    addEvent(name, handler) {
        this.events.set(name, handler);
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
        this.permissions = info.permissions || ((msg) => __awaiter(this, void 0, void 0, function* () { return true; }));
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
    execute(msg, args) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.enabled)
                    return;
                else if (this.onlyOwner && msg.author.id != msg.client.config.ownerId)
                    return;
                else if (this.onlyGuild && !msg.guild)
                    return msg.channel.send(`That command can only be used in a server.`);
                else if (this.onlyDm && msg.guild)
                    return msg.channel.send(`That command can only be used in a DM`);
                else if (((_a = this.userPermissions) === null || _a === void 0 ? void 0 : _a.length) > 0 && (msg.guild ? !((_b = msg.member) === null || _b === void 0 ? void 0 : _b.permissions.any(this.userPermissions, true)) : false))
                    return msg.channel.send(`You don't have permission to use that command!`);
                else if (yield this.permissions(msg))
                    return yield this.process(msg, ...args);
                else
                    return;
            }
            catch (error) {
                if (this.client)
                    this.client.errorHandler(error, msg);
                else
                    console.error(error);
            }
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
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let reply = "";
                if (!this.enabled)
                    return;
                else if (this.onlyOwner && ((_a = interaction.member) === null || _a === void 0 ? void 0 : _a.user.id) != this.client.config.ownerId)
                    return;
                else if (this.onlyGuild && !interaction.guild)
                    reply = `That command can only be used in a server.`;
                else if (this.onlyDm && interaction.guild)
                    reply = `That command can only be used in a DM`;
                else if (interaction.guild ? !((_b = interaction.member) === null || _b === void 0 ? void 0 : _b.permissions).any(this.userPermissions) : false)
                    reply = `You don't have permission to use that command!`;
                if (!reply && (yield this.validation(interaction)))
                    return yield this.process(interaction);
                else if (interaction.isRepliable()) {
                    interaction.reply({ content: reply, ephemeral: true });
                }
            }
            catch (error) {
                if (this.client)
                    this.client.errorHandler(error, interaction);
                else
                    console.error(error);
            }
        });
    }
}
exports.AugurInteractionCommand = AugurInteractionCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVndXJib3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9hdWd1cmJvdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDRDQUFtQjtBQUNuQix5REFJbUI7QUFDbkIsa0RBQXlCO0FBQ3pCLGdEQUF1QjtBQU92Qiw4REFBMkM7QUF3QzNDOzswQkFFMEI7QUFFMUIsTUFBTSxRQUFRLEdBQUc7SUFDYixZQUFZLEVBQUUsQ0FBQyxLQUFxQixFQUFFLEdBQVMsRUFBRSxFQUFFO1FBQy9DLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN0QixJQUFJLEdBQUcsWUFBWSxvQkFBTyxDQUFDLE9BQU8sRUFBRTtZQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLE1BQU8sR0FBRyxDQUFDLE9BQWdDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7U0FDaks7YUFBTSxJQUFJLEdBQUcsRUFBRTtZQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDdEI7UUFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxLQUFLLEVBQUUsQ0FBQyxHQUFvQixFQUFFLEVBQUU7UUFDNUIsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQztRQUMxQixJQUFJLFNBQVMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUE7UUFDeEMsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUc7WUFBRSxPQUFPLElBQUksQ0FBQztRQUNoQyxLQUFLLElBQUksTUFBTSxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ3JGLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztnQkFBRSxTQUFTO1lBQzFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDcEUsSUFBSSxPQUFPLEVBQUU7Z0JBQ1QsT0FBTztvQkFDSCxPQUFPLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRTtvQkFDOUIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO29CQUN4QixNQUFNO2lCQUNULENBQUM7YUFDTDtTQUNKO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUNKLENBQUM7QUFHRjs7aUJBRWlCO0FBRWpCLE1BQU0sZ0JBQWlCLFNBQVEsdUJBQWtDO0lBRTdELFlBQVksTUFBc0I7UUFDOUIsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN6QixDQUFDO0lBRUQsUUFBUSxDQUFDLElBQThDO1FBQ25ELElBQUksSUFBSSxDQUFDLFNBQVM7WUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDOUQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFnQjtRQUNuQixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDcEIsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3pCO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUNKO0FBb3VCRyw0Q0FBZ0I7QUFqdUJwQixNQUFNLGNBQWUsU0FBUSx1QkFBZ0M7SUFJekQsWUFBWSxNQUFzQjtRQUM5QixLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSx1QkFBVSxFQUFFLENBQUM7UUFDaEMsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUNLLE9BQU8sQ0FBQyxHQUFvQixFQUFFLE1BQWM7O1lBQzlDLElBQUk7Z0JBQ0EsSUFBSSxFQUNBLE9BQU8sRUFDUCxNQUFNLEVBQ04sTUFBTSxFQUNULEdBQUcsTUFBTSxDQUFDO2dCQUNYLElBQUksWUFBOEMsQ0FBQztnQkFDbkQsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztvQkFBRSxZQUFZLEdBQUcsSUFBSSxDQUFDO3FCQUN0QyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztvQkFBRSxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7b0JBQzNELE9BQU87Z0JBRVosSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNwQixJQUFJLEdBQUcsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxXQUFXO29CQUNoQixPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDOztvQkFFaEMsT0FBTyxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7YUFDMUM7WUFBQyxPQUFPLEtBQVUsRUFBRTtnQkFDakIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDL0M7UUFDTCxDQUFDO0tBQUE7SUFFRCxRQUFRLENBQUMsSUFBd0Y7UUFDN0YsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pDLElBQUk7Z0JBQ0EsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUN6QixPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUTtvQkFBRSxPQUFPLENBQUMsUUFBUSxHQUFHLGNBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFN0UsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDckMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDNUIsS0FBSyxJQUFJLEtBQUssSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7d0JBQzdFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDdEQ7YUFDSjtZQUFDLE9BQU8sS0FBVSxFQUFFO2dCQUNqQixJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUscUJBQXFCLE9BQU8sQ0FBQyxJQUFJLFFBQVEsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7YUFDN0Y7U0FDSjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7Q0FDSjtBQThxQkcsd0NBQWM7QUE1cUJsQixNQUFNLFlBQWEsU0FBUSx1QkFBZ0Q7SUFFdkUsWUFBWSxNQUFzQjtRQUM5QixLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxRQUFRLENBQUMsSUFBMEQ7O1FBQy9ELElBQUksQ0FBQSxNQUFBLElBQUksQ0FBQyxNQUFNLDBDQUFFLElBQUksSUFBRyxDQUFDLEVBQUU7WUFDdkIsS0FBSyxNQUFNLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztvQkFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLHVCQUFVLENBQUM7d0JBQ2pELENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUM7cUJBQ3ZCLENBQUMsQ0FBQyxDQUFDOztvQkFDQyxNQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLDBDQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQ2pEO1NBQ0o7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0NBQ0o7QUEycEJHLG9DQUFZO0FBenBCaEIsTUFBTSxrQkFBbUIsU0FBUSx1QkFBMkM7SUFFeEUsWUFBWSxNQUFzQjtRQUM5QixLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3pCLENBQUM7SUFFSyxLQUFLLENBQUMsR0FBVyxFQUFFLElBQVUsRUFBRSxNQUFNLEdBQUcsS0FBSzs7WUFDL0MsT0FBTyxDQUFDLE1BQU0sSUFBQSxlQUFLLEVBQUM7Z0JBQ2hCLEdBQUc7Z0JBQ0gsT0FBTyxFQUFFLDRDQUE0QyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRTtnQkFDaEYsTUFBTTtnQkFDTixPQUFPLEVBQUU7b0JBQ0wsZUFBZSxFQUFFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7aUJBQzlDO2dCQUNELElBQUk7YUFDUCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDYixDQUFDO0tBQUE7SUFFRCxRQUFRLENBQUMsSUFBK0U7O1FBQ3BGLEtBQUssTUFBTSxXQUFXLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtZQUN6QyxJQUFJO2dCQUNBLFdBQVcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDN0IsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7b0JBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsNkJBQTZCLFdBQVcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxrQkFBa0IsV0FBVyxDQUFDLEVBQUUsNEJBQTRCLE1BQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLDBDQUFFLElBQUksOEJBQThCLENBQUMsQ0FBQztnQkFDaE8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2FBQ3pDO1lBQUMsT0FBTyxLQUFVLEVBQUU7Z0JBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSx5QkFBeUIsV0FBVyxDQUFDLElBQUksY0FBYyxXQUFXLENBQUMsS0FBSyxPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2FBQ25JO1NBQ0o7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7O3FDQUVpQztJQUVqQyxpQkFBaUIsQ0FBQyxTQUFpQjtRQUMvQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFFRCxtQkFBbUIsQ0FBQyxJQUFvQztRQUNwRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQsaUJBQWlCLENBQUMsU0FBaUIsRUFBRSxJQUFvQztRQUNyRSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVELG1CQUFtQixDQUFDLFNBQWlCO1FBQ2pDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQ7O29DQUVnQztJQUVoQyxnQkFBZ0IsQ0FBQyxPQUFlLEVBQUUsU0FBaUI7UUFDL0MsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsT0FBTyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDMUYsQ0FBQztJQUVELGtCQUFrQixDQUFDLE9BQWUsRUFBRSxJQUFvQztRQUNwRSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxPQUFPLFdBQVcsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbkUsQ0FBQztJQUVELGdCQUFnQixDQUFDLE9BQWUsRUFBRSxTQUFpQixFQUFFLElBQW9DO1FBQ3JGLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLE9BQU8sYUFBYSxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDakYsQ0FBQztJQUVELGtCQUFrQixDQUFDLE9BQWUsRUFBRSxTQUFpQjtRQUNqRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxPQUFPLGFBQWEsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2xGLENBQUM7Q0FDSjtBQW1sQkcsZ0RBQWtCO0FBamxCdEIsTUFBTSxhQUFhO0lBT2YsWUFBWSxNQUFzQjtRQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFFekIsTUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUNoQyxNQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDNUIsTUFBTSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO0lBQzVDLENBQUM7SUFFRCxRQUFRLENBQUMsSUFBWSxFQUFFLElBQVc7O1FBQzlCLElBQUksSUFBSSxFQUFFO1lBQ04sSUFBSSxRQUFRLEdBQUcsY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQyxJQUFJO2dCQUNBLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFL0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDakMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUMxQixJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztnQkFFckIsOEJBQThCO2dCQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFN0IsMEJBQTBCO2dCQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFM0IscUJBQXFCO2dCQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFOUIsd0JBQXdCO2dCQUN4QixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFakMsYUFBYTtnQkFDYixNQUFBLElBQUksQ0FBQyxJQUFJLHFEQUFHLElBQUksQ0FBQyxDQUFDO2dCQUVsQiwyQkFBMkI7Z0JBQzNCLElBQUksSUFBSSxDQUFDLE1BQU07b0JBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUM1RDtZQUFDLE9BQU8sS0FBVSxFQUFFO2dCQUNqQixJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsYUFBYSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2FBQzVEO1NBQ0o7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsTUFBTSxDQUFDLElBQVk7UUFDZixJQUFJLElBQUksRUFBRTtZQUNOLElBQUksUUFBUSxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEMsSUFBSTtnQkFDQSxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQzthQUN2QztZQUFDLE9BQU8sS0FBVSxFQUFFO2dCQUNqQixJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsV0FBVyxRQUFRLEVBQUUsQ0FBQyxDQUFBO2FBQ3pEO1NBQ0o7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsTUFBTSxDQUFDLElBQVk7O1FBQ2YsSUFBSSxJQUFJLEVBQUU7WUFDTixJQUFJLFFBQVEsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xDLElBQUk7Z0JBQ0Esa0JBQWtCO2dCQUNsQixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFaEMsdUJBQXVCO2dCQUN2QixLQUFLLElBQUksQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtvQkFDdkMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDN0I7Z0JBRUQsNkJBQTZCO2dCQUM3QixLQUFLLElBQUksQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtvQkFDeEQsSUFBSSxXQUFXLENBQUMsSUFBSSxJQUFJLFFBQVE7d0JBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7aUJBQzdFO2dCQUVELFNBQVM7Z0JBQ1QsSUFBSSxVQUFVLENBQUM7Z0JBQ2YsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDNUIsVUFBVSxHQUFHLENBQUMsTUFBQSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsbUNBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzFELElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUNqQztnQkFFRCw2QkFBNkI7Z0JBQzdCLEtBQUssSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUN2QyxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksUUFBUTt3QkFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDNUQ7Z0JBQ0QsS0FBSyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO29CQUNoRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksUUFBUTt3QkFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ3JFO2dCQUVELHNCQUFzQjtnQkFDdEIsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFFaEQsT0FBTyxVQUFVLENBQUM7YUFDckI7WUFBQyxPQUFPLEtBQVUsRUFBRTtnQkFDakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLFdBQVcsUUFBUSxFQUFFLENBQUMsQ0FBQzthQUMxRDtTQUNKO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELFNBQVM7UUFDTCxpQ0FBaUM7UUFDakMsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDM0MsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQy9CO1FBRUQsdUJBQXVCO1FBQ3ZCLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3ZDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNwQjtRQUVELG1CQUFtQjtRQUNuQixLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUN2QyxJQUFJO2dCQUNBLE1BQU0sRUFBRSxDQUFDO2FBQ1o7WUFBQyxPQUFPLEtBQVUsRUFBRTtnQkFDakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLFdBQVcsSUFBSSxFQUFFLENBQUMsQ0FBQzthQUN0RDtTQUNKO1FBRUQsNkJBQTZCO1FBQzdCLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFOUIscUJBQXFCO1FBQ3JCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFMUIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUNKO0FBb2NHLHNDQUFhO0FBbGNqQjs7cUJBRXFCO0FBR3JCLE1BQU0sV0FBWSxTQUFRLG1CQUFNO0lBUzVCLFlBQVksTUFBaUIsRUFBRSxVQUF3QixFQUFFOztRQUVyRCxNQUFNLE9BQU8sR0FBRyxJQUFBLG9CQUFnQixFQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRW5FLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYTtZQUFFLE9BQU8sQ0FBQyxhQUFhLEdBQUc7Z0JBQzVDLE9BQU87YUFDZCxDQUFDO2FBQ0csSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTztZQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUVoRixLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRTdCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFN0MsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUM7UUFDNUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUEsTUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsMENBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0osSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksSUFBSSxRQUFRLENBQUMsWUFBWSxDQUFDO1FBQzVFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQztRQUN2RCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFBO1FBQ3BDLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFBO1FBQ3ZCLG9CQUFvQjtRQUNwQixJQUFJLE1BQUEsSUFBSSxDQUFDLFlBQVksMENBQUUsUUFBUSxFQUFFO1lBQzdCLElBQUksV0FBVyxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvSCxJQUFJO2dCQUNBLElBQUksWUFBWSxHQUFHLFlBQUUsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUM5RSxLQUFLLElBQUksT0FBTyxJQUFJLFlBQVksRUFBRTtvQkFDOUIsSUFBSTt3QkFDQSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO3FCQUNuRTtvQkFBQyxPQUFPLEtBQVUsRUFBRTt3QkFDakIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsOEJBQThCLE9BQU8sRUFBRSxDQUFDLENBQUM7cUJBQ3JFO2lCQUNKO2FBQ0o7WUFBQyxPQUFPLEtBQVUsRUFBRTtnQkFDakIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsbUNBQW1DLFdBQVcsRUFBRSxDQUFDLENBQUM7YUFDOUU7U0FDSjtRQUdELHFCQUFxQjtRQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFTLEVBQUU7O1lBQzFCLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBQSxNQUFBLENBQUMsTUFBTSxDQUFBLE1BQUEsSUFBSSxDQUFDLFdBQVcsMENBQUUsS0FBSyxFQUFFLENBQUEsQ0FBQywwQ0FBRSxFQUFFLG1DQUFJLEVBQUUsQ0FBQztRQUNyRSxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBUyxFQUFFOztZQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBQSxJQUFJLENBQUMsSUFBSSwwQ0FBRSxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxVQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxjQUFjLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM1RyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLGdCQUFnQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLFdBQVcsQ0FBQyxDQUFDO1lBQ3ZHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQzFCLEtBQUssSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxNQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxtQ0FBSSxJQUFJLHVCQUFVLEVBQUUsRUFBRTtvQkFDdEUsSUFBSTt3QkFDQSxJQUFJLE1BQU0sT0FBTyxFQUFFOzRCQUFFLE1BQU07cUJBQzlCO29CQUFDLE9BQU8sS0FBVSxFQUFFO3dCQUNqQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxrQkFBa0IsSUFBSSxFQUFFLENBQUMsQ0FBQztxQkFDdEQ7aUJBQ0o7YUFDSjtRQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxDQUFPLEdBQUcsRUFBRSxFQUFFOztZQUNuQyxJQUFJLElBQUksR0FBRyxLQUFLLENBQUM7WUFDakIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDNUIsSUFBSSxHQUFHLENBQUMsT0FBTyxFQUFFO29CQUNiLElBQUk7d0JBQ0EsTUFBTSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7cUJBQ3JCO29CQUFDLE9BQU8sS0FBVSxFQUFFO3dCQUNqQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxtQ0FBbUMsQ0FBQyxDQUFDO3FCQUNqRTtpQkFDSjtnQkFDRCxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksTUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsbUNBQUksSUFBSSx1QkFBVSxFQUFFLEVBQUU7b0JBQ3hFLElBQUk7d0JBQ0EsSUFBSSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUMxQixJQUFJLElBQUk7NEJBQUUsTUFBTTtxQkFDbkI7b0JBQUMsT0FBTyxLQUFVLEVBQUU7d0JBQ2pCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO3dCQUM5QixJQUFJLEdBQUcsSUFBSSxDQUFDO3dCQUNaLE1BQU07cUJBQ1Q7aUJBQ0o7YUFDSjtZQUNELElBQUk7Z0JBQ0EsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxNQUFNLElBQUksQ0FBQyxJQUFJO29CQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQzthQUMzRDtZQUFDLE9BQU8sS0FBVSxFQUFFO2dCQUNqQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQzthQUNqQztRQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxDQUFPLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTs7WUFDeEMsSUFBSSxHQUFHLENBQUMsT0FBTyxLQUFLLEdBQUcsQ0FBQyxPQUFPO2dCQUFFLE9BQU87WUFDeEMsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO1lBQ2pCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLEVBQUU7Z0JBQ2xDLElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRTtvQkFDYixJQUFJO3dCQUNBLE1BQU0sR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO3FCQUNyQjtvQkFBQyxPQUFPLEtBQVUsRUFBRTt3QkFDakIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSwwQ0FBMEMsQ0FBQyxDQUFDO3FCQUMvRTtpQkFDSjtnQkFDRCxHQUFHLEdBQUcsR0FBYyxDQUFBO2dCQUNwQixLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksTUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsbUNBQUksSUFBSSx1QkFBVSxFQUFFLEVBQUU7b0JBQzlFLElBQUk7d0JBQ0EsSUFBSSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQzt3QkFDL0IsSUFBSSxJQUFJOzRCQUFFLE1BQU07cUJBQ25CO29CQUFDLE9BQU8sS0FBVSxFQUFFO3dCQUNqQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQzt3QkFDOUIsSUFBSSxHQUFHLElBQUksQ0FBQzt3QkFDWixNQUFNO3FCQUNUO2lCQUNKO2FBQ0o7WUFDRCxJQUFJO2dCQUNBLElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRTtvQkFDYixJQUFJO3dCQUNBLE1BQU0sR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO3FCQUNyQjtvQkFBQyxPQUFPLEtBQVUsRUFBRTt3QkFDakIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSwwQ0FBMEMsQ0FBQyxDQUFDO3FCQUMvRTtpQkFDSjtnQkFDRCxHQUFHLEdBQUcsR0FBc0IsQ0FBQTtnQkFDNUIsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxNQUFNLElBQUksQ0FBQyxJQUFJO29CQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQzthQUMzRDtZQUFDLE9BQU8sS0FBVSxFQUFFO2dCQUNqQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQzthQUNqQztRQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLENBQU8sV0FBVyxFQUFFLEVBQUU7O1lBQy9DLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztZQUNqQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLEVBQUU7Z0JBQ3RDLEtBQUssSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxNQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLG1DQUFJLElBQUksdUJBQVUsRUFBRSxFQUFFO29CQUNsRixJQUFJO3dCQUNBLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQzt3QkFDbEMsSUFBSSxJQUFJOzRCQUFFLE1BQU07cUJBQ25CO29CQUFDLE9BQU8sS0FBVSxFQUFFO3dCQUNqQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSw4QkFBOEIsSUFBSSxFQUFFLENBQUMsQ0FBQzt3QkFDL0QsTUFBTTtxQkFDVDtpQkFDSjthQUNKO1lBQ0QsSUFBSTtnQkFDQSxJQUFJLENBQUMsSUFBSTtvQkFBRSxNQUFNLENBQUEsTUFBQSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLDBDQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQSxDQUFDO2FBQ2hGO1lBQUMsT0FBTyxLQUFVLEVBQUU7Z0JBQ2pCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLDJCQUEyQixXQUFXLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUN6RTtRQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7UUFHSCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFO1lBQ25ELElBQUksQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBTyxRQUFRLEVBQUUsSUFBSSxFQUFFLEVBQUU7O2dCQUNuRCxJQUFJLENBQUMsTUFBQSxNQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLDBDQUFFLElBQUksbUNBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUN4RCxJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUU7d0JBQ2xCLElBQUk7NEJBQ0EsTUFBTSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7eUJBQzFCO3dCQUFDLE9BQU8sS0FBVSxFQUFFOzRCQUNqQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDO3lCQUMxRTtxQkFDSjtvQkFDRCxJQUFJLE1BQUEsUUFBUSxDQUFDLE9BQU8sMENBQUUsT0FBTyxFQUFFO3dCQUMzQixJQUFJOzRCQUNBLE1BQU0sUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQzt5QkFDbEM7d0JBQUMsT0FBTyxLQUFVLEVBQUU7NEJBQ2pCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLDRDQUE0QyxDQUFDLENBQUM7eUJBQzFFO3FCQUNKO29CQUNELEtBQUssSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxNQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLG1DQUFJLElBQUksdUJBQVUsRUFBRSxFQUFFO3dCQUNuRixJQUFJOzRCQUNBLElBQUksTUFBTSxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQztnQ0FBRSxNQUFNO3lCQUM1Qzt3QkFBQyxPQUFPLEtBQVUsRUFBRTs0QkFDakIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsK0JBQStCLElBQUksRUFBRSxDQUFDLENBQUM7NEJBQ2hFLE1BQU07eUJBQ1Q7cUJBQ0o7aUJBQ0o7WUFDTCxDQUFDLENBQUEsQ0FBQyxDQUFDO1NBQ047UUFFRCxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUEsTUFBQSxJQUFJLENBQUMsTUFBTSwwQ0FBRSxNQUFNLEtBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxlQUFlLEVBQUUsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUUsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFNUosS0FBSyxJQUFJLEtBQUssSUFBSSxNQUFNLEVBQUU7WUFDdEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBTyxHQUFHLElBQUksRUFBRSxFQUFFOztnQkFDN0IsSUFBSSxDQUFDLE1BQUEsTUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsMENBQUUsSUFBSSxtQ0FBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ3pDLEtBQUssSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxNQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxtQ0FBSSxJQUFJLHVCQUFVLEVBQUUsRUFBRTt3QkFDcEUsSUFBSTs0QkFDQSxJQUFJLE1BQU0sT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDO2dDQUFFLE1BQU07eUJBQ3JDO3dCQUFDLE9BQU8sS0FBVSxFQUFFOzRCQUNqQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxHQUFHLEtBQUssYUFBYSxJQUFJLEVBQUUsQ0FBQyxDQUFDOzRCQUN0RCxNQUFNO3lCQUNUO3FCQUNKO2lCQUNKO1lBQ0wsQ0FBQyxDQUFBLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQztJQUVELE9BQU87UUFDSCxJQUFJO1lBQ0EsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtTQUNqQztRQUFDLE9BQU8sS0FBVSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLG9DQUFvQyxDQUFDLENBQUM7U0FDbEU7UUFDRCxPQUFPLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQsS0FBSyxDQUFDLEtBQWE7O1FBQ2YsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSSxNQUFBLElBQUksQ0FBQyxNQUFNLDBDQUFFLEtBQUssQ0FBQSxDQUFDLENBQUM7SUFDcEQsQ0FBQztDQUNKO0FBK05HLGtDQUFXO0FBN05mOzt5QkFFeUI7QUFFekIsTUFBTSxXQUFXO0lBU2I7UUFDSSxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksdUJBQVUsRUFBRSxDQUFDO1FBQy9CLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxVQUFVLENBQUMsSUFBc0I7UUFDN0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3hELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxRQUFRLENBQUMsSUFBZ0MsRUFBRSxPQUFpQjtRQUN4RCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDL0IsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUdELGNBQWMsQ0FBQyxJQUFpQztRQUM1QyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLHVCQUF1QixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN2RSxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsWUFBWSxDQUFDLFNBQW9CO1FBQzdCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBVTtRQUNkLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxTQUFTLENBQUMsTUFBYztRQUNwQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0NBQ0o7QUE4S2tCLDZCQUFNO0FBckp6QixNQUFNLFlBQVk7SUFvQmQsWUFBWSxJQUFzQixFQUFFLE1BQXNCOztRQUN0RCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDN0IsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO1NBQzdFO1FBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBQSxJQUFJLENBQUMsT0FBTyxtQ0FBSSxFQUFFLENBQUM7UUFDbEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFBLElBQUksQ0FBQyxNQUFNLG1DQUFJLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsV0FBVyxHQUFHLE1BQUEsSUFBSSxDQUFDLFdBQVcsbUNBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM1RSxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQUEsSUFBSSxDQUFDLElBQUksbUNBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUMxQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQUEsSUFBSSxDQUFDLE1BQU0sbUNBQUksS0FBSyxDQUFDO1FBQ25DLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBQSxJQUFJLENBQUMsUUFBUSxtQ0FBSSxTQUFTLENBQUM7UUFDM0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFBLElBQUksQ0FBQyxPQUFPLG1DQUFJLElBQUksQ0FBQztRQUNwQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFPLEdBQUcsRUFBRSxFQUFFLGdEQUFDLE9BQUEsSUFBSSxDQUFBLEdBQUEsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM1QyxJQUFJLENBQUMsV0FBVyxHQUFHLE1BQUEsSUFBSSxDQUFDLFdBQVcsbUNBQUksS0FBSyxDQUFDO1FBQzdDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBQSxJQUFJLENBQUMsT0FBTyxtQ0FBSSxFQUFFLENBQUM7UUFDbEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzVCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUM7UUFDekMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQztRQUN6QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDO1FBQ25DLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFBO1FBQ2QsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDekIsQ0FBQztJQUVLLE9BQU8sQ0FBQyxHQUFvQixFQUFFLElBQWM7OztZQUM5QyxJQUFJO2dCQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTztvQkFBRSxPQUFNO3FCQUNwQixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTztvQkFBRSxPQUFPO3FCQUN6RSxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSztvQkFBRSxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLDRDQUE0QyxDQUFDLENBQUE7cUJBQ3ZHLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSztvQkFBRSxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHVDQUF1QyxDQUFDLENBQUE7cUJBQzlGLElBQUksQ0FBQSxNQUFBLElBQUksQ0FBQyxlQUFlLDBDQUFFLE1BQU0sSUFBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsTUFBQSxHQUFHLENBQUMsTUFBTSwwQ0FBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO29CQUFFLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0RBQWdELENBQUMsQ0FBQTtxQkFDak0sSUFBSSxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDO29CQUFFLE9BQU8sTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDOztvQkFDekUsT0FBTzthQUNmO1lBQUMsT0FBTyxLQUFVLEVBQUU7Z0JBQ2pCLElBQUksSUFBSSxDQUFDLE1BQU07b0JBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDOztvQkFDakQsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUM3Qjs7S0FDSjtDQUNKO0FBeUZHLG9DQUFZO0FBcEVoQixNQUFNLHVCQUF1QjtJQW1CekIsWUFBWSxJQUFpQyxFQUFFLE1BQXNCOztRQUNqRSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO1NBQzNFO1FBQ0QsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQUEsSUFBSSxDQUFDLE1BQU0sbUNBQUksRUFBRSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBQSxJQUFJLENBQUMsV0FBVyxtQ0FBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVFLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBQSxJQUFJLENBQUMsSUFBSSxtQ0FBSSxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQzFDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBQSxJQUFJLENBQUMsTUFBTSxtQ0FBSSxLQUFLLENBQUM7UUFDbkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQzlCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBQSxJQUFJLENBQUMsT0FBTyxtQ0FBSSxJQUFJLENBQUM7UUFDcEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFBLElBQUksQ0FBQyxPQUFPLG1DQUFJLEVBQUUsQ0FBQztRQUNsQyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDNUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsR0FBUyxFQUFFLGdEQUFDLE9BQUEsSUFBSSxDQUFBLEdBQUEsQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUM1QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUM7UUFDekMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQztRQUNuQyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQTtRQUNkLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3pCLENBQUM7SUFFSyxPQUFPLENBQUMsV0FBb0M7OztZQUM5QyxJQUFJO2dCQUNBLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQTtnQkFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU87b0JBQUUsT0FBTTtxQkFDcEIsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUEsTUFBQSxXQUFXLENBQUMsTUFBTSwwQ0FBRSxJQUFJLENBQUMsRUFBRSxLQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU87b0JBQUUsT0FBTztxQkFDeEYsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUs7b0JBQUUsS0FBSyxHQUFHLDRDQUE0QyxDQUFBO3FCQUM5RixJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksV0FBVyxDQUFDLEtBQUs7b0JBQUUsS0FBSyxHQUFHLHVDQUF1QyxDQUFBO3FCQUNyRixJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFBLFdBQVcsQ0FBQyxNQUFNLDBDQUFFLFdBQTJDLENBQUEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLO29CQUFFLEtBQUssR0FBRyxnREFBZ0QsQ0FBQTtnQkFDMUwsSUFBSSxDQUFDLEtBQUssS0FBSSxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUE7b0JBQUUsT0FBTyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7cUJBQ3BGLElBQUksV0FBVyxDQUFDLFdBQVcsRUFBRSxFQUFFO29CQUNoQyxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtpQkFDdkQ7YUFDSjtZQUFDLE9BQU8sS0FBVSxFQUFFO2dCQUNqQixJQUFJLElBQUksQ0FBQyxNQUFNO29CQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQzs7b0JBQ3pELE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDN0I7O0tBQ0o7Q0FDSjtBQVVHLDBEQUF1QiJ9