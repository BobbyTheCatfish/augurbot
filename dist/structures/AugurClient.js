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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
                var _a, _b, _c, _d, _e;
                this.log("Bot is ready");
                this.applicationId = (_c = (_b = (yield ((_a = this.application) === null || _a === void 0 ? void 0 : _a.fetch()))) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : "";
                this.log("Application ID fetched. Delaying augurReady");
                yield this.delayStart().catch(error => this.errorHandler(error, "Augur Delay Start Function"));
                this.log("Delay complete. Loading modules.");
                // PRE-LOAD COMMANDS
                const moduleFolder = ((_d = this.augurOptions) === null || _d === void 0 ? void 0 : _d.commands) || ((_e = this.augurOptions) === null || _e === void 0 ? void 0 : _e.modules);
                if (moduleFolder) {
                    const commandPath = path_1.default.resolve(require.main ? path_1.default.dirname(require.main.filename) : process.cwd(), moduleFolder);
                    try {
                        const tsCheck = process.versions.bun !== undefined || process.versions.deno !== undefined;
                        const commandFiles = fs_1.default.readdirSync(commandPath).filter(f => f.endsWith(".js") || (tsCheck && f.endsWith(".ts")));
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
                    var _a;
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
                    const isEdited = ((_a = message.editedTimestamp) !== null && _a !== void 0 ? _a : 0) > Date.now() - 30 * 60000 && // filter old messages
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
                var _a;
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
                    yield ((_a = this.moduleManager.interactions.get(id)) === null || _a === void 0 ? void 0 : _a.execute(interaction));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXVndXJDbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3RydWN0dXJlcy9BdWd1ckNsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHlEQUF5RTtBQUN6RSxnREFBdUI7QUFDdkIsNENBQW1CO0FBQ25CLCtEQUE0QztBQUU1Qyx3RUFBa0Q7QUFFbEQsZ0VBQW9DO0FBaUJwQyxNQUFxQixXQUFZLFNBQVEsbUJBQU07SUFjbkMsR0FBRyxDQUFDLEdBQVE7UUFDaEIsSUFBSSxJQUFJLENBQUMsS0FBSztZQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDcEMsQ0FBQztJQUVhLFVBQVU7OztZQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBQSxJQUFJLENBQUMsSUFBSSwwQ0FBRSxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxVQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxhQUFhLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM1RyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLGdCQUFnQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLFdBQVcsQ0FBQyxDQUFDO1lBQ3ZHLElBQUksQ0FBQyxHQUFHLENBQUMscUJBQXFCLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDdkUsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNWLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBQSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLG1DQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RSxPQUFPLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3ZCLE1BQU0sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUNyQyxJQUFJLENBQUM7d0JBQ0QsSUFBSSxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUM7NEJBQUUsTUFBTTt3QkFDL0IsQ0FBQyxFQUFFLENBQUM7b0JBQ1IsQ0FBQztvQkFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO3dCQUNsQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxrQkFBa0IsUUFBUSxFQUFFLENBQUMsQ0FBQzt3QkFDdkQsTUFBTTtvQkFDVixDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQztLQUFBO0lBRU8sUUFBUSxDQUFDLEdBQTZDO1FBQzFELElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2QsSUFBSSxDQUFDO2dCQUNELElBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtnQkFDNUIsT0FBTyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdkIsQ0FBQztZQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLG1DQUFtQyxDQUFDLENBQUM7Z0JBQzlELE9BQU87WUFDWCxDQUFDO1FBQ0wsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUVPLFVBQVUsQ0FBQyxHQUFxRDtRQUNwRSxJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNkLElBQUksQ0FBQztnQkFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUE7Z0JBQzdCLE9BQU8sR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3ZCLENBQUM7WUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO2dCQUMvRCxPQUFPO1lBQ1gsQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7SUFFYSxZQUFZLENBQUMsU0FBaUIsRUFBRSxJQUFXLEVBQUUsUUFBNEU7OztZQUNuSSxLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLElBQUksTUFBQSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLG1DQUFJLEVBQUUsRUFBRSxDQUFDO2dCQUMvRSxJQUFJLENBQUM7b0JBQ0QsSUFBSSxNQUFNLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQzt3QkFBRSxPQUFPLElBQUksQ0FBQztnQkFDNUMsQ0FBQztnQkFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO29CQUNsQixJQUFJLFFBQVEsWUFBWSxRQUFRO3dCQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBOzt3QkFDekUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUE7b0JBQ3ZDLE9BQU8sSUFBSSxDQUFDO2dCQUNoQixDQUFDO1lBQ0wsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7S0FBQTtJQUVhLEtBQUs7OztZQUNmLHdCQUF3QjtZQUN4QixJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFBO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQVMsRUFBRTs7Z0JBQzFCLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUE7Z0JBQ3hCLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBQSxNQUFBLENBQUMsTUFBTSxDQUFBLE1BQUEsSUFBSSxDQUFDLFdBQVcsMENBQUUsS0FBSyxFQUFFLENBQUEsQ0FBQywwQ0FBRSxFQUFFLG1DQUFJLEVBQUUsQ0FBQztnQkFDakUsSUFBSSxDQUFDLEdBQUcsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFBO2dCQUN2RCxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSw0QkFBNEIsQ0FBQyxDQUFDLENBQUE7Z0JBQzlGLElBQUksQ0FBQyxHQUFHLENBQUMsa0NBQWtDLENBQUMsQ0FBQTtnQkFDNUMsb0JBQW9CO2dCQUNwQixNQUFNLFlBQVksR0FBRyxDQUFBLE1BQUEsSUFBSSxDQUFDLFlBQVksMENBQUUsUUFBUSxNQUFJLE1BQUEsSUFBSSxDQUFDLFlBQVksMENBQUUsT0FBTyxDQUFBLENBQUE7Z0JBQzlFLElBQUksWUFBWSxFQUFFLENBQUM7b0JBQ2YsTUFBTSxXQUFXLEdBQUcsY0FBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztvQkFDbkgsSUFBSSxDQUFDO3dCQUNELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUM7d0JBQzFGLE1BQU0sWUFBWSxHQUFHLFlBQUUsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDbEgsS0FBSyxNQUFNLE9BQU8sSUFBSSxZQUFZLEVBQUUsQ0FBQzs0QkFDakMsSUFBSSxDQUFDO2dDQUNELElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7NEJBQ3BFLENBQUM7NEJBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztnQ0FDbEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsOEJBQThCLE9BQU8sRUFBRSxDQUFDLENBQUM7NEJBQ3RFLENBQUM7d0JBQ0wsQ0FBQztvQkFDTCxDQUFDO29CQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7d0JBQ2xCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLG1DQUFtQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO29CQUMvRSxDQUFDO2dCQUNMLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO2dCQUMxQixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUNyQyxDQUFDLENBQUEsQ0FBQyxDQUFDO1lBRUgsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlLEVBQUUsQ0FBTyxPQUFPLEVBQUUsRUFBRTtvQkFDdkMsSUFBSSxDQUFDLHFCQUFxQixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7d0JBQzNGLElBQUksQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQTt3QkFDcEMsT0FBTztvQkFDWCxDQUFDO29CQUNELElBQUksQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQTtvQkFDckMsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO29CQUNqQixJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO3dCQUNqRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFBO3dCQUNuRSxJQUFJLENBQUMsR0FBRyxDQUFDLDJCQUEyQixPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO29CQUN4RCxDQUFDO29CQUVELElBQUksSUFBSTt3QkFBRSxPQUFPO29CQUVqQixJQUFJLENBQUM7d0JBQ0QsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUN2QyxJQUFJLENBQUMsR0FBRyxDQUFDLG1CQUFtQixPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBO3dCQUM5QyxJQUFJLE1BQU07NEJBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDckUsQ0FBQztvQkFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO3dCQUNsQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDdEMsQ0FBQztnQkFDTCxDQUFDLENBQUEsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLENBQU8sR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFOztvQkFDNUMsSUFBSSxDQUFDLHFCQUFxQixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7d0JBQzNGLElBQUksQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQTt3QkFDcEMsT0FBTztvQkFDWCxDQUFDO29CQUNELElBQUksQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQTtvQkFFbEMsb0JBQW9CO29CQUNwQixNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ2hELElBQUksVUFBVTt3QkFBRSxPQUFPLEdBQUcsVUFBVSxDQUFDOzt3QkFDaEMsT0FBTztvQkFFWixNQUFNLFFBQVEsR0FBRyxDQUFDLE1BQUEsT0FBTyxDQUFDLGVBQWUsbUNBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFNLElBQUksc0JBQXNCO3dCQUNuRixDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBLENBQUMsY0FBYztvQkFDcEYsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFBO29CQUM1RCxJQUFJLElBQUksR0FBRyxLQUFLLENBQUM7b0JBRWpCLElBQUksUUFBUSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO3dCQUMzRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQzt3QkFDdkUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtvQkFDN0QsQ0FBQztvQkFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUMxRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQTt3QkFDeEUsSUFBSSxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtvQkFDeEQsQ0FBQztvQkFFRCxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVE7d0JBQUUsT0FBTztvQkFFOUIsSUFBSSxDQUFDO3dCQUNELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDekMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTt3QkFDOUMsSUFBSSxNQUFNOzRCQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBQ3JFLENBQUM7b0JBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQzt3QkFDbEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ3RDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFBLENBQUMsQ0FBQztZQUNQLENBQUM7WUFFRCxJQUFJLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLENBQU8sV0FBVyxFQUFFLEVBQUU7O2dCQUMvQyxJQUFJLENBQUMsR0FBRyxDQUFDLCtCQUErQixDQUFDLENBQUE7Z0JBQ3pDLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztnQkFDakIsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDO29CQUNyRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLG1CQUFtQixFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUE7b0JBQy9FLElBQUksQ0FBQyxHQUFHLENBQUMsc0NBQXNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQ25FLENBQUM7Z0JBRUQsSUFBSSxJQUFJO29CQUFFLE9BQU87Z0JBRWpCLElBQUksQ0FBQztvQkFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLHlDQUF5QyxDQUFDLENBQUE7b0JBQ25ELE1BQU0sRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxJQUFJLFdBQVcsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFBO29CQUNuSCxNQUFNLENBQUEsTUFBQSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLDBDQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQSxDQUFDO2dCQUN4RSxDQUFDO2dCQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7b0JBQ2xCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUMxQyxDQUFDO1lBQ0wsQ0FBQyxDQUFBLENBQUMsQ0FBQztZQUVILElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFPLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRTtvQkFDbkQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO29CQUNoQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7d0JBQ3RELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDakQsSUFBSSxRQUFROzRCQUFFLFFBQVEsR0FBRyxRQUFRLENBQUM7OzRCQUM3QixPQUFPO3dCQUVaLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQ3pELElBQUksVUFBVTs0QkFBRSxRQUFRLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQzs7NEJBQ3pDLE9BQU87d0JBRVosSUFBSSxDQUFDLEdBQUcsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFBO3dCQUNuRCxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFBO29CQUNyRixDQUFDO2dCQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7WUFDUCxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQSxNQUFBLElBQUksQ0FBQyxNQUFNLDBDQUFFLE1BQU0sS0FBSSxFQUFFLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXZCLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQU8sR0FBRyxJQUFJLEVBQUUsRUFBRTtvQkFDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssV0FBVyxDQUFDLENBQUE7b0JBQzdCLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ3ZDLElBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEtBQUssdUJBQXVCLENBQUMsQ0FBQTt3QkFDeEQsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsS0FBSyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUE7b0JBQ3pFLENBQUM7Z0JBQ0wsQ0FBQyxDQUFBLENBQUMsQ0FBQztZQUNQLENBQUM7UUFDTCxDQUFDO0tBQUE7SUFDRCxZQUFZLE1BQWlCLEVBQUUsVUFBd0IsRUFBRTs7UUFFckQsTUFBTSxPQUFPLEdBQUcsSUFBQSxvQkFBZ0IsRUFBQyxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFN0YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhO1lBQUUsT0FBTyxDQUFDLGFBQWEsR0FBRyxFQUFFLE9BQU8sRUFBRSxDQUFDO2FBQzNELElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU87WUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7UUFFaEYsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFzQyxDQUFDLENBQUM7UUFnQ2xELGVBQVUsR0FBOEYsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxFQUFFO1lBQ3JJLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUMzQyxJQUFJLENBQUMsT0FBTztnQkFBRSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQTtZQUNuRSxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSTtnQkFBRSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLFVBQVUsRUFBRSxvQkFBTyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtZQUNyRyxPQUFPLE9BQWdDLENBQUE7UUFDM0MsQ0FBQyxDQUFBO1FBbkNHLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxvQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTdDLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDO1FBQzVCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBLE1BQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLDBDQUFFLEtBQUssRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdKLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLElBQUkscUJBQVEsQ0FBQyxZQUFZLENBQUM7UUFDNUUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssSUFBSSxxQkFBUSxDQUFDLEtBQUssQ0FBQztRQUN2RCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsSUFBSSxxQkFBUSxDQUFDLGdCQUFnQixDQUFBO1FBQ3ZGLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLG9CQUFvQixJQUFJLHFCQUFRLENBQUMsb0JBQW9CLENBQUE7UUFDbkcsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsSUFBSSxxQkFBUSxDQUFDLFVBQVUsQ0FBQTtRQUNyRSxJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQTtRQUN2QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtRQUNsQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7SUFDaEIsQ0FBQztJQUVELE9BQU87UUFDSCxJQUFJLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUE7UUFDakMsSUFBSSxDQUFDO1lBQ0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUM5QixJQUFJLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUE7UUFDcEMsQ0FBQztRQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsb0NBQW9DLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO1FBQzdCLE9BQU8sS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFDRCxLQUFLLENBQUMsS0FBYzs7UUFDaEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUN0QixPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFJLE1BQUEsSUFBSSxDQUFDLE1BQU0sMENBQUUsS0FBSyxDQUFBLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBT0QsWUFBWSxDQUFFLEVBQVUsRUFBRSxPQUFlLEVBQUUsUUFBZ0I7O1FBQ3ZELElBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtRQUM1QixJQUFJLE1BQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLDBDQUFFLFFBQVE7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGNBQWMsUUFBUSxzQkFBc0IsT0FBTyxrQkFBa0IsRUFBRSxHQUFHLENBQUMsQ0FBQTs7WUFDN0gsT0FBTyxJQUFJLENBQUM7SUFDckIsQ0FBQztJQUNELGNBQWMsQ0FBQyxFQUFVO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBQ3pDLENBQUM7SUFDRCxZQUFZLENBQUMsRUFBVTtRQUNuQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUN2QyxDQUFDO0lBQ0QsaUJBQWlCLENBQUMsRUFBVTtRQUN4QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFBO0lBQ3JELENBQUM7SUFDRCxlQUFlLENBQUMsRUFBVTtRQUN0QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUMxQyxDQUFDO0lBQ0Qsa0JBQWtCLENBQUMsRUFBVTtRQUN6QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQTtJQUM3QyxDQUFDO0lBQ0QsY0FBYyxDQUFDLEVBQVU7UUFDckIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDekMsQ0FBQztJQUNELHNCQUFzQixDQUFDLEVBQVU7UUFDN0IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUscUJBQXFCLENBQUMsQ0FBQTtJQUN6RCxDQUFDO0lBQ0QsZUFBZSxDQUFDLEVBQVU7UUFDdEIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUE7SUFDbkQsQ0FBQztJQUNELGdCQUFnQixDQUFDLEVBQVU7UUFDdkIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQTtJQUNwRCxDQUFDO0lBQ0QsUUFBUSxDQUFDLEVBQVU7UUFDZixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUMzQyxDQUFDO0lBQ0QsWUFBWSxDQUFDLEVBQVU7UUFDbkIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUE7SUFDL0MsQ0FBQztJQUNELGVBQWUsQ0FBQyxFQUFVO1FBQ3RCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQzNDLENBQUM7Q0FDSjtBQTFURCw4QkEwVEMifQ==