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
const discord_js_1 = __importStar(require("discord.js"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const intents_js_1 = __importDefault(require("../intents.js"));
const Modules_js_1 = __importDefault(require("../managers/Modules.js"));
const defaults_js_1 = __importDefault(require("./defaults.js"));
class AugurClient extends discord_js_1.Client {
    log(msg) {
        if (this.debug)
            console.log(msg);
    }
    readyEvent() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`${(_a = this.user) === null || _a === void 0 ? void 0 : _a.username} ${(this.shard ? ` Shard ${this.shard.ids} ` : "")}ready at: ${Date()}`);
            console.log(`Listening to ${this.channels.cache.size} channels in ${this.guilds.cache.size} servers.`);
            this.log(`events has ready: ${this.moduleManager.events.has("ready")}`);
            if (this.moduleManager.events.has("ready")) {
                let i = 0;
                const events = Array.from((_b = this.moduleManager.events.get("ready")) !== null && _b !== void 0 ? _b : []);
                while (i < events.length) {
                    const [filepath, handler] = events[i];
                    try {
                        if (yield handler(this))
                            break;
                        i++;
                    }
                    catch (error) {
                        this.errorHandler(error, `Ready Handler: ${filepath}`);
                        break;
                    }
                }
            }
        });
    }
    fetchMsg(obj) {
        if (obj.partial) {
            try {
                this.log("fetching message");
                return obj.fetch();
            }
            catch (error) {
                this.errorHandler(error, "Augur Fetch Partial Message Error");
                return;
            }
        }
        return obj;
    }
    fetchReact(obj) {
        if (obj.partial) {
            try {
                this.log("fetching reaction");
                return obj.fetch();
            }
            catch (error) {
                this.errorHandler(error, "Augur Fetch Partial Reaction Error");
                return;
            }
        }
        return obj;
    }
    start() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // HANDLE INITIALIZATION
            this.log("Bot started");
            this.once("ready", () => __awaiter(this, void 0, void 0, function* () {
                var _b, _c, _d, _e, _f;
                this.log("Bot is ready");
                this.applicationId = (_d = (_c = (yield ((_b = this.application) === null || _b === void 0 ? void 0 : _b.fetch()))) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : "";
                this.log("Application ID fetched. Delaying augurReady");
                yield this.delayStart().catch(error => this.errorHandler(error, "Augur Delay Start Function"));
                this.log("Delay complete. Loading modules.");
                // PRE-LOAD COMMANDS
                const moduleFolder = ((_e = this.augurOptions) === null || _e === void 0 ? void 0 : _e.commands) || ((_f = this.augurOptions) === null || _f === void 0 ? void 0 : _f.modules);
                if (moduleFolder) {
                    const commandPath = path_1.default.resolve(require.main ? path_1.default.dirname(require.main.filename) : process.cwd(), moduleFolder);
                    try {
                        const commandFiles = fs_1.default.readdirSync(commandPath).filter(f => f.endsWith(".js"));
                        for (const command of commandFiles) {
                            try {
                                this.moduleManager.register(path_1.default.resolve(commandPath, command));
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
                this.log("Augur is Ready");
                this.readyEvent();
                this.on("ready", this.readyEvent);
            }));
            if (this.config.events.includes("messageCreate")) {
                this.on("messageCreate", (message) => __awaiter(this, void 0, void 0, function* () {
                    var _g, _h;
                    this.log("message creation detected");
                    let halt = false;
                    if (this.moduleManager.events.has("message")) {
                        const newMsg = yield this.fetchMsg(message);
                        if (newMsg)
                            message = newMsg;
                        else
                            return;
                        let i = 0;
                        const events = Array.from((_h = (_g = this.moduleManager.events.get("messageCreate")) === null || _g === void 0 ? void 0 : _g.values()) !== null && _h !== void 0 ? _h : []);
                        while (i < events.length && !halt) {
                            try {
                                const handler = events[i];
                                halt = yield handler(message);
                                i++;
                            }
                            catch (error) {
                                this.errorHandler(error, message);
                                halt = true;
                                break;
                            }
                        }
                        this.log(`message parsing halted: ${Boolean(halt)}`);
                    }
                    if (halt)
                        return;
                    try {
                        let parsed = yield this.parse(message);
                        this.log(`message parsed: ${Boolean(parsed)}`);
                        if (parsed)
                            this.moduleManager.commands.execute(message, parsed);
                    }
                    catch (error) {
                        this.errorHandler(error, message);
                    }
                }));
            }
            if (this.config.events.includes("messageUpdate")) {
                this.on("messageUpdate", (old, message) => __awaiter(this, void 0, void 0, function* () {
                    var _j, _k, _l, _m, _o;
                    this.log("messageUpdate detected");
                    const isEdited = ((_j = message.editedTimestamp) !== null && _j !== void 0 ? _j : 0) > Date.now() - 60 * 1000 && // filter cdn updates
                        (old.pinned == null || old.pinned == message.pinned); // filter pins
                    this.log(`message is edited: ${isEdited}`);
                    let halt = false;
                    if (isEdited && this.moduleManager.events.has("messageEdit")) {
                        this.log("message being handled as edited");
                        const newMessage = yield this.fetchMsg(message);
                        if (newMessage)
                            message = newMessage;
                        else
                            return;
                        let i = 0;
                        const events = Array.from((_l = (_k = this.moduleManager.events.get("messageEdit")) === null || _k === void 0 ? void 0 : _k.values()) !== null && _l !== void 0 ? _l : []);
                        while (i < events.length && !halt) {
                            try {
                                const handler = events[i];
                                halt = yield handler(old, message);
                                i++;
                            }
                            catch (error) {
                                this.errorHandler(error, message);
                                halt = true;
                                break;
                            }
                        }
                        this.log(`message edit parsing halted: ${Boolean(halt)}`);
                    }
                    if (this.moduleManager.events.has("messageUpdate") && !halt) {
                        this.log("message being handled as updated");
                        const newMessage = yield this.fetchMsg(message);
                        if (newMessage)
                            message = newMessage;
                        else
                            return;
                        let i = 0;
                        const events = Array.from((_o = (_m = this.moduleManager.events.get("messageUpdate")) === null || _m === void 0 ? void 0 : _m.values()) !== null && _o !== void 0 ? _o : []);
                        while (i < events.length && !halt) {
                            try {
                                const handler = events[i];
                                halt = yield handler(old, message);
                                i++;
                            }
                            catch (error) {
                                this.errorHandler(error, message);
                                halt = true;
                                break;
                            }
                        }
                        this.log(`message parsing halted: ${Boolean(halt)}`);
                    }
                    if (halt || !isEdited)
                        return;
                    try {
                        const newMessage = yield this.fetchMsg(message);
                        if (newMessage)
                            message = newMessage;
                        else
                            return;
                        const parsed = yield this.parse(message);
                        this.log(`message parsed: ${Boolean(parsed)}`);
                        if (parsed)
                            this.moduleManager.commands.execute(message, parsed);
                    }
                    catch (error) {
                        this.errorHandler(error, message);
                    }
                }));
            }
            this.on("interactionCreate", (interaction) => __awaiter(this, void 0, void 0, function* () {
                var _p, _q;
                this.log("interaction creation detected");
                let halt = false;
                if (this.moduleManager.events.has("interactionCreate")) {
                    let i = 0;
                    const events = Array.from((_p = this.moduleManager.events.get("interactionCreate")) !== null && _p !== void 0 ? _p : []);
                    while (i < events.length && !halt) {
                        const [file, handler] = events[i];
                        try {
                            halt = yield handler(interaction);
                            i++;
                        }
                        catch (error) {
                            this.errorHandler(error, `interactionCreate Handler: ${file}`);
                            halt = true;
                            break;
                        }
                    }
                    this.log(`interactionCreate handling halted: ${Boolean(halt)}`);
                }
                try {
                    this.log("executing interaction as addInteraction");
                    if (!halt)
                        yield ((_q = this.moduleManager.interactions.get(interaction.isCommand() || interaction.isAutocomplete() ? interaction.commandId
                            : interaction.customId)) === null || _q === void 0 ? void 0 : _q.execute(interaction));
                }
                catch (error) {
                    this.errorHandler(error, `Interaction Processing: ${interaction.id}`);
                }
            }));
            if (this.config.events.includes("messageReactionAdd")) {
                this.on("messageReactionAdd", (reaction, user) => __awaiter(this, void 0, void 0, function* () {
                    var _r;
                    this.log("reactionAdd detected");
                    if (this.moduleManager.events.has("messageReactionAdd")) {
                        const newReact = yield this.fetchReact(reaction);
                        if (newReact)
                            reaction = newReact;
                        else
                            return;
                        const newMessage = yield this.fetchMsg(reaction.message);
                        if (newMessage)
                            reaction.message = newMessage;
                        else
                            return;
                        this.log("running all messageReactionAdd handlers");
                        let i = 0;
                        const events = Array.from((_r = this.moduleManager.events.get("messageEdit")) !== null && _r !== void 0 ? _r : []);
                        while (i < events.length) {
                            const [file, handler] = events[i];
                            try {
                                if (yield handler(reaction, user))
                                    break;
                                i++;
                            }
                            catch (error) {
                                this.errorHandler(error, `messageReactionAdd Handler: ${file}`);
                                break;
                            }
                        }
                    }
                }));
            }
            let events = (((_a = this.config) === null || _a === void 0 ? void 0 : _a.events) || [])
                .filter(event => ![
                "message",
                "messageUpdate",
                "interactionCreate",
                "messageReactionAdd",
                "ready"
            ].includes(event));
            for (const event of events) {
                this.on(event, (...args) => __awaiter(this, void 0, void 0, function* () {
                    var _s;
                    this.log(`${event} detected`);
                    if (this.moduleManager.events.has(event)) {
                        this.log(`handler(s) for ${event} found, trying now...`);
                        let i = 0;
                        const events = Array.from((_s = this.moduleManager.events.get("messageEdit")) !== null && _s !== void 0 ? _s : []);
                        while (i < events.length) {
                            const [file, handler] = events[i];
                            try {
                                if (yield handler(...args))
                                    break;
                                i++;
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
        this.moduleManager = new Modules_js_1.default(this);
        this.augurOptions = options;
        this.config = config;
        this.db = (((_a = this.config.db) === null || _a === void 0 ? void 0 : _a.model) ? require(path_1.default.resolve((require.main ? path_1.default.dirname(require.main.filename) : process.cwd()), this.config.db.model)) : null);
        this.errorHandler = this.augurOptions.errorHandler || defaults_js_1.default.errorHandler;
        this.parse = this.augurOptions.parse || defaults_js_1.default.parse;
        this.commandExecution = this.augurOptions.commandExecution || defaults_js_1.default.commandExecution;
        this.interactionExecution = this.augurOptions.interactionExecution || defaults_js_1.default.interactionExecution;
        this.delayStart = this.augurOptions.delayStart || defaults_js_1.default.delayStart;
        this.applicationId = "";
        this.debug = false;
        this.start();
    }
    destroy() {
        this.log("client destroy called");
        try {
            this.moduleManager.unloadAll();
            this.log("all modules unloaded");
        }
        catch (error) {
            this.errorHandler(error, "Unload prior to destroying client.");
        }
        this.log("destroying client");
        return super.destroy();
    }
    login(token) {
        var _a;
        this.log("logging in");
        return super.login(token || ((_a = this.config) === null || _a === void 0 ? void 0 : _a.token));
    }
    wrongTypeErr(id, strType, expected) {
        var _a;
        this.log("Wrong type error");
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
exports.default = AugurClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXVndXJDbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3RydWN0dXJlcy9BdWd1ckNsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseURBQXlFO0FBQ3pFLGdEQUF1QjtBQUN2Qiw0Q0FBbUI7QUFDbkIsK0RBQTRDO0FBRTVDLHdFQUFrRDtBQUVsRCxnRUFBb0M7QUFpQnBDLE1BQXFCLFdBQVksU0FBUSxtQkFBTTtJQWNuQyxHQUFHLENBQUMsR0FBUTtRQUNoQixJQUFJLElBQUksQ0FBQyxLQUFLO1lBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNwQyxDQUFDO0lBRWEsVUFBVTs7O1lBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFBLElBQUksQ0FBQyxJQUFJLDBDQUFFLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksZ0JBQWdCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksV0FBVyxDQUFDLENBQUM7WUFDdkcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUN2RSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUN6QyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JB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