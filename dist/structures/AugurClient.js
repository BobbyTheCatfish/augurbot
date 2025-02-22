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
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
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
    eventHandler(eventName, args, errorMsg) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            for (const [filepath, handler] of (_a = this.moduleManager.events.get(eventName)) !== null && _a !== void 0 ? _a : []) {
                try {
                    if (yield handler(...args))
                        return true;
                }
                catch (error) {
                    if (errorMsg instanceof Function)
                        this.errorHandler(error, errorMsg(filepath));
                    else
                        this.errorHandler(error, errorMsg);
                    return true;
                }
            }
            return false;
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                    if (("interactionMetadata" in message && message.interactionMetadata) || message.interaction) {
                        this.log("interaction message sent");
                        return;
                    }
                    this.log("message creation detected");
                    let halt = false;
                    if (this.moduleManager.events.has("messageCreate")) {
                        halt = yield this.eventHandler("messageCreate", [message], message);
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
                    var _g;
                    if (("interactionMetadata" in message && message.interactionMetadata) || message.interaction) {
                        this.log("interaction message edit");
                        return;
                    }
                    this.log("messageUpdate detected");
                    // fetch the message
                    const newMessage = yield this.fetchMsg(message);
                    if (newMessage)
                        message = newMessage;
                    else
                        return;
                    const isEdited = ((_g = message.editedTimestamp) !== null && _g !== void 0 ? _g : 0) > Date.now() - 30 * 60000 && // filter old messages
                        (old.pinned == null || old.pinned == message.pinned); // filter pins
                    this.log(`message is ${isEdited ? "edited" : "not edited"}`);
                    let halt = false;
                    if (isEdited && this.moduleManager.events.has("messageEdit")) {
                        halt = yield this.eventHandler("messageEdit", [old, message], message);
                        this.log(`message edit parsing halted: ${Boolean(halt)}`);
                    }
                    if (this.moduleManager.events.has("messageUpdate") && !halt) {
                        halt = yield this.eventHandler("messageUpdate", [old, message], message);
                        this.log(`message parsing halted: ${Boolean(halt)}`);
                    }
                    if (halt || !isEdited)
                        return;
                    try {
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
                var _h;
                this.log("interaction creation detected");
                let halt = false;
                if (this.moduleManager.events.has("interactionCreate")) {
                    halt = yield this.eventHandler("interactionCreate", [interaction], interaction);
                    this.log(`interactionCreate handling halted: ${Boolean(halt)}`);
                }
                if (halt)
                    return;
                try {
                    this.log("executing interaction as addInteraction");
                    const id = (interaction.isCommand() || interaction.isAutocomplete()) ? interaction.commandId : interaction.customId;
                    yield ((_h = this.moduleManager.interactions.get(id)) === null || _h === void 0 ? void 0 : _h.execute(interaction));
                }
                catch (error) {
                    this.errorHandler(error, interaction);
                }
            }));
            if (this.config.events.includes("messageReactionAdd")) {
                this.on("messageReactionAdd", (reaction, user) => __awaiter(this, void 0, void 0, function* () {
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
                        yield this.eventHandler("messageReactionAdd", [reaction, user], reaction.message);
                    }
                }));
            }
            const events = new Set(((_a = this.config) === null || _a === void 0 ? void 0 : _a.events) || []);
            events.delete("messageCreate");
            events.delete("messageUpdate");
            events.delete("interactionCreate");
            events.delete("messageReactionAdd");
            events.delete("ready");
            for (const event of events) {
                this.on(event, (...args) => __awaiter(this, void 0, void 0, function* () {
                    this.log(`${event} detected`);
                    if (this.moduleManager.events.has(event)) {
                        this.log(`handler(s) for ${event} found, trying now...`);
                        yield this.eventHandler(event, args, (f) => `${event} Handler: ${f}`);
                    }
                }));
            }
        });
    }
    constructor(config, options = {}) {
        var _a;
        const intents = (0, intents_js_1.default)(config.events, config.getMessageContent, config.processDMs);
        if (!options.clientOptions)
            options.clientOptions = { intents };
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