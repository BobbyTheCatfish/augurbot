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
exports.defaults = exports.Module = exports.AugurClient = void 0;
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
            /**permissions*/ else if (!(yield cmd.permissions(interaction)))
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
                    yield ((_m = this.interactions.get(interaction.isCommand() ? interaction.commandId
                        : interaction.isAutocomplete() ? interaction.commandId
                            : interaction.customId)) === null || _m === void 0 ? void 0 : _m.execute(interaction));
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
class AugurInteractionCommand {
    constructor(info, client) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (!info.id || !info.process) {
            throw new Error("Commands must have the `id` and `process` properties");
        }
        this.id = info.id;
        this.name = (_a = info.name) !== null && _a !== void 0 ? _a : info.id;
        this.syntax = (_b = info.syntax) !== null && _b !== void 0 ? _b : "";
        this.description = (_c = info.description) !== null && _c !== void 0 ? _c : `${this.name} ${this.syntax}`.trim();
        this.info = (_d = info.info) !== null && _d !== void 0 ? _d : this.description;
        this.hidden = (_e = info.hidden) !== null && _e !== void 0 ? _e : false;
        this.category = (_f = info.category) !== null && _f !== void 0 ? _f : "";
        this.enabled = (_g = info.enabled) !== null && _g !== void 0 ? _g : true;
        this.options = (_h = info.options) !== null && _h !== void 0 ? _h : {};
        this.userPermissions = (_j = info.userPermissions) !== null && _j !== void 0 ? _j : [];
        this.permissions = info.permissions || (() => __awaiter(this, void 0, void 0, function* () { return true; }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVndXJib3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9hdWd1cmJvdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDRDQUFtQjtBQUNuQix5REFJbUI7QUFDbkIsa0RBQXlCO0FBQ3pCLGdEQUF1QjtBQU92Qiw4REFBMkM7QUF3RTNDO3VCQUN1QjtBQUV2QixNQUFNLFFBQVEsR0FBRztJQUNiLFlBQVksRUFBRSxDQUFDLEtBQXFCLEVBQUUsT0FBYSxFQUFFLEVBQUU7UUFDbkQsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3RCLElBQUksT0FBTyxZQUFZLG9CQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxNQUFPLE9BQU8sQ0FBQyxPQUFnQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQ3RMLENBQUM7YUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ2pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUNELE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUVELEtBQUssRUFBRSxDQUFPLE9BQXdCLEVBQUUsRUFBRTtRQUN0QyxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQzlCLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQTtRQUM1QyxJQUFJLE9B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