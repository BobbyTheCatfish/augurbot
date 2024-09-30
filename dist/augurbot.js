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
            /**Only Specific Guild*/ else if (cmd.guildId && ((_d = interaction.guild) === null || _d === void 0 ? void 0 : _d.id) != cmd.guildId)
                reply = `That command can only be used in a specific server.`;
            /**Only DM*/ else if (cmd.onlyDm && interaction.guild)
                reply = `That command can only be used in a DM`;
            /**userPermissions*/ else if (cmd.userPermissions.length > 0 && (interaction.inGuild() ? !interaction.member.permissions.has(cmd.userPermissions) : true))
                reply = `You don't have permission to use that command!`;
            /**permissions*/ else if (!(yield cmd.permissions(interaction)))
                reply = `You don't have permission to use that command!`;
            if (interaction.isAutocomplete()) {
                if (reply)
                    return;
                else
                    return yield cmd.autocomplete(interaction);
            }
            else {
                if (reply) {
                    if (!interaction.replied && !interaction.deferred)
                        interaction.reply({ content: reply, ephemeral: true });
                    else
                        interaction.editReply({ content: reply });
                }
                else
                    return yield cmd.process(interaction);
            }
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
    }),
    delayStart: () => __awaiter(void 0, void 0, void 0, function* () {
        return;
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
                interaction.client = load.client;
                if (this.has(interaction.id))
                    this.client.errorHandler(`Duplicate Interaction ID: ${interaction.id}`, `Interaction id ${interaction.id} already registered in \`${(_a = this.get(interaction.id)) === null || _a === void 0 ? void 0 : _a.file}\`. It is being overwritten.`);
                this.set(interaction.id, interaction);
            }
            catch (error) {
                this.client.errorHandler(error, `Register interaction "${interaction.name}" in guild ${interaction.guildId} in ${load.filepath}`);
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
class AugurClient extends discord_js_1.Client {
    readyEvent() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`${(_a = this.user) === null || _a === void 0 ? void 0 : _a.username} ${(this.shard ? ` Shard ${this.shard.ids} ` : "")}ready at: ${Date()}`);
            console.log(`Listening to ${this.channels.cache.size} channels in ${this.guilds.cache.size} servers.`);
            if (this.events.has("ready")) {
                for (let [file, handler] of (_b = this.events.get("ready")) !== null && _b !== void 0 ? _b : new discord_js_1.Collection()) {
                    try {
                        if (yield handler())
                            break;
                    }
                    catch (error) {
                        this.errorHandler(error, `Ready Handler: ${file}`);
                    }
                }
            }
        });
    }
    start() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // SET EVENT HANDLERS
            let ready = false;
            this.once("ready", () => __awaiter(this, void 0, void 0, function* () {
                var _c, _d, _e;
                ready = true;
                this.applicationId = (_e = (_d = (yield ((_c = this.application) === null || _c === void 0 ? void 0 : _c.fetch()))) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : "";
            }));
            yield this.delayStart();
            // PRE-LOAD COMMANDS
            if ((_a = this.augurOptions) === null || _a === void 0 ? void 0 : _a.commands) {
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
            if (ready) {
                this.readyEvent();
            }
            this.on("ready", () => __awaiter(this, void 0, void 0, function* () {
                this.readyEvent();
            }));
            if (this.config.events.includes("messageCreate")) {
                this.on("messageCreate", (message) => __awaiter(this, void 0, void 0, function* () {
                    var _f;
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
                        for (let [file, handler] of (_f = this.events.get("message")) !== null && _f !== void 0 ? _f : new discord_js_1.Collection()) {
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
                    if (halt)
                        return;
                    try {
                        let parsed = yield this.parse(message);
                        if (parsed)
                            this.commands.execute(message, parsed);
                    }
                    catch (error) {
                        this.errorHandler(error, message);
                    }
                }));
            }
            if (this.config.events.includes("messageUpdate")) {
                this.on("messageUpdate", (old, message) => __awaiter(this, void 0, void 0, function* () {
                    var _g, _h, _j;
                    if (old.content === message.content)
                        return;
                    let halt = false;
                    if (this.events.has("messageEdit")) {
                        if (message.partial) {
                            try {
                                yield message.fetch();
                            }
                            catch (error) {
                                return this.errorHandler(error, "Augur Fetch Partial Message Edit Error");
                            }
                        }
                        message = message;
                        if (((_g = message.editedTimestamp) !== null && _g !== void 0 ? _g : 0) < Date.now() - 60 * 60 * 1000)
                            halt = true;
                        else
                            for (let [file, handler] of (_h = this.events.get("messageEdit")) !== null && _h !== void 0 ? _h : new discord_js_1.Collection()) {
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
                    if (this.events.has("messageUpdate") && !halt) {
                        if (message.partial) {
                            try {
                                yield message.fetch();
                            }
                            catch (error) {
                                return this.errorHandler(error, "Augur Fetch Partial Message Update Error");
                            }
                        }
                        message = message;
                        for (let [file, handler] of (_j = this.events.get("messageUpdate")) !== null && _j !== void 0 ? _j : new discord_js_1.Collection()) {
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
                    if (halt)
                        return;
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
                        const parsed = yield this.parse(message);
                        if (parsed)
                            this.commands.execute(message, parsed);
                    }
                    catch (error) {
                        this.errorHandler(error, message);
                    }
                }));
            }
            this.on("interactionCreate", (interaction) => __awaiter(this, void 0, void 0, function* () {
                var _k, _l;
                let halt = false;
                if (this.events.has("interactionCreate")) {
                    for (let [file, handler] of (_k = this.events.get("interactionCreate")) !== null && _k !== void 0 ? _k : new discord_js_1.Collection()) {
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
                        yield ((_l = this.interactions.get(interaction.isCommand() ? interaction.commandId
                            : interaction.isAutocomplete() ? interaction.commandId
                                : interaction.customId)) === null || _l === void 0 ? void 0 : _l.execute(interaction));
                }
                catch (error) {
                    this.errorHandler(error, `Interaction Processing: ${interaction.id}`);
                }
            }));
            if (this.config.events.includes("messageReactionAdd")) {
                this.on("messageReactionAdd", (reaction, user) => __awaiter(this, void 0, void 0, function* () {
                    var _m, _o, _p, _q;
                    if (((_o = (_m = this.events.get("messageReactionAdd")) === null || _m === void 0 ? void 0 : _m.size) !== null && _o !== void 0 ? _o : 0) > 0) {
                        if (reaction.partial) {
                            try {
                                yield reaction.fetch();
                            }
                            catch (error) {
                                this.errorHandler(error, "Augur Fetch Partial Message Reaction Error");
                            }
                        }
                        if ((_p = reaction.message) === null || _p === void 0 ? void 0 : _p.partial) {
                            try {
                                yield reaction.message.fetch();
                            }
                            catch (error) {
                                this.errorHandler(error, "Augur Fetch Partial Reaction.Message Error");
                            }
                        }
                        for (let [file, handler] of (_q = this.events.get("messageReactionAdd")) !== null && _q !== void 0 ? _q : new discord_js_1.Collection()) {
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
            let events = (((_b = this.config) === null || _b === void 0 ? void 0 : _b.events) || []).filter(event => !["message", "messageUpdate", "interactionCreate", "messageReactionAdd", "ready"].includes(event));
            for (let event of events) {
                this.on(event, (...args) => __awaiter(this, void 0, void 0, function* () {
                    var _r, _s, _t;
                    if (((_s = (_r = this.events.get(event)) === null || _r === void 0 ? void 0 : _r.size) !== null && _s !== void 0 ? _s : 0) > 0) {
                        for (let [file, handler] of (_t = this.events.get(event)) !== null && _t !== void 0 ? _t : new discord_js_1.Collection()) {
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
        });
    }
    constructor(config, options = {}) {
        var _a;
        const intents = (0, intents_js_1.default)(config.events, config.processDMs);
        if (!options.clientOptions)
            options.clientOptions = {
                intents
            };
        else if (!options.clientOptions.intents)
            options.clientOptions.intents = intents;
        super(options.clientOptions);
        this.getChannel = (id, type, stringType) => {
            const channel = this.channels.cache.get(id);
            if (!channel)
                return this.wrongTypeErr(id, stringType, "Undefined");
            if (channel.type != type)
                return this.wrongTypeErr(id, stringType, discord_js_1.default.ChannelType[channel.type]);
            return channel;
        };
        this.moduleHandler = new ModuleManager(this);
        this.augurOptions = options;
        this.config = config;
        this.db = (((_a = this.config.db) === null || _a === void 0 ? void 0 : _a.model) ? require(path_1.default.resolve((require.main ? path_1.default.dirname(require.main.filename) : process.cwd()), this.config.db.model)) : null);
        this.errorHandler = this.augurOptions.errorHandler || DEFAULTS.errorHandler;
        this.parse = this.augurOptions.parse || DEFAULTS.parse;
        this.commandExecution = this.augurOptions.commandExecution || DEFAULTS.commandExecution;
        this.interactionExecution = this.augurOptions.interactionExecution || DEFAULTS.interactionExecution;
        this.delayStart = this.augurOptions.delayStart || DEFAULTS.delayStart;
        this.applicationId = "";
        this.start();
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
    wrongTypeErr(id, strType, expected) {
        var _a;
        if ((_a = this.config.strictTypes) === null || _a === void 0 ? void 0 : _a.channels)
            throw new Error(`Expected a ${expected} channel but got a ${strType} instead. (id: ${id})`);
        else
            return null;
    }
    getTextChannel(id) {
        return this.getChannel(id, 0, "Text");
    }
    getDmChannel(id) {
        return this.getChannel(id, 1, "DM");
    }
    getGroupDmChannel(id) {
        return this.getChannel(id, 3, "Partial Group DM");
    }
    getVoiceChannel(id) {
        return this.getChannel(id, 2, "Voice");
    }
    getCategoryChannel(id) {
        return this.getChannel(id, 4, "Category");
    }
    getNewsChannel(id) {
        return this.getChannel(id, 5, "News");
    }
    getAnnouncementsThread(id) {
        return this.getChannel(id, 10, "Annoucements Thread");
    }
    getPublicThread(id) {
        return this.getChannel(id, 11, "Public Thread");
    }
    getPrivateThread(id) {
        return this.getChannel(id, 12, "Private Thread");
    }
    getStage(id) {
        return this.getChannel(id, 13, "Stage");
    }
    getDirectory(id) {
        return this.getChannel(id, 14, "Directory");
    }
    getForumChannel(id) {
        return this.getChannel(id, 15, "Forum");
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
        this.permissions = info.permissions || (() => true);
        this.userPermissions = (_h = info.userPermissions) !== null && _h !== void 0 ? _h : [];
        this.parseParams = (_j = info.parseParams) !== null && _j !== void 0 ? _j : false;
        this.options = (_k = info.options) !== null && _k !== void 0 ? _k : {};
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
        this.guildId = info.guildId;
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
        this.autocomplete = info.autocomplete || (() => { });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVndXJib3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9hdWd1cmJvdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDRDQUFtQjtBQUNuQix5REFJbUI7QUFDbkIsa0RBQXlCO0FBQ3pCLGdEQUF1QjtBQUN2Qiw4REFBMkM7QUEwRzNDO3VCQUN1QjtBQUV2QixNQUFNLFFBQVEsR0FBRztJQUNiLFlBQVksRUFBRSxDQUFDLEtBQXFCLEVBQUUsT0FBYSxFQUFFLEVBQUU7UUFDbkQsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3RCLElBQUksT0FBTyxZQUFZLG9CQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxNQUFPLE9BQU8sQ0FBQyxPQUFnQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQ3RMLENBQUM7YUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ2pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUNELE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUVELEtBQUssRUFBRSxDQUFPLE9BQXdCLEVBQUUsRUFBRTtRQUN0QyxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQzlCLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQTtRQUM1QyxJQUFJLE9B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