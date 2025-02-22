import Discord, { Client, Collection, MessageReaction } from "discord.js"
import path from 'path'
import fs from "fs"
import calculateIntents from '../intents.js'
import { ErrorHandler, ParseFunction } from "../types/UtilTypes.js"
import ModuleManager from "../managers/Modules.js"
import { AugurOptions, BotConfig, CommandExecution, InteractionExecution } from "../types/ClientTypes.js"
import DEFAULTS from "./defaults.js"

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

export default class AugurClient extends Client {
    config: BotConfig
    augurOptions: AugurOptions
    moduleManager: ModuleManager
    /** @deprecated Probably best to implement database stuff yourself. Removing in the next major version. */
    db?: any
    errorHandler: ErrorHandler
    parse: ParseFunction
    commandExecution: CommandExecution
    interactionExecution: InteractionExecution
    delayStart: () => Promise<any>
    applicationId: string
    private debug: boolean

    private log(msg: any) {
        if (this.debug) console.log(msg)
    }

    private async readyEvent () {
        console.log(`${this.user?.username} ${(this.shard ? ` Shard ${this.shard.ids} ` : "")}ready at: ${Date()}`);
        console.log(`Listening to ${this.channels.cache.size} channels in ${this.guilds.cache.size} servers.`);
        this.log(`events has ready: ${this.moduleManager.events.has("ready")}`)
        if (this.moduleManager.events.has("ready")) {
            let i = 0;
            const events = Array.from(this.moduleManager.events.get("ready") ?? []);
            while (i < events.length) {
                const [filepath, handler] = events[i]
                try {
                    if (await handler(this)) break;
                    i++;
                } catch (error: any) {
                    this.errorHandler(error, `Ready Handler: ${filepath}`);
                    break;
                }
            }
        }
    }

    private fetchMsg(obj: Discord.PartialMessage | Discord.Message) {
        if (obj.partial) {
            try {
                this.log("fetching message")
                return obj.fetch();
            } catch (error: any) {
                this.errorHandler(error, "Augur Fetch Partial Message Error");
                return;
            }
        }
        return obj;
    }
    
    private fetchReact(obj: Discord.PartialMessageReaction | MessageReaction) {
        if (obj.partial) {
            try {
                this.log("fetching reaction")
                return obj.fetch();
            } catch (error: any) {
                this.errorHandler(error, "Augur Fetch Partial Reaction Error");
                return;
            }
        }
        return obj;
    }

    private async eventHandler(eventName: string, args: any[], errorMsg: Discord.Message | Discord.Interaction | ((path: string) => string)) {
        for (const [filepath, handler] of this.moduleManager.events.get(eventName) ?? []) {
            try {
                if (await handler(...args)) return true;
            } catch (error: any) {
                if (errorMsg instanceof Function) this.errorHandler(error, errorMsg(filepath))
                else this.errorHandler(error, errorMsg)
                return true;
            }
        }
        return false;
    }

    private async start() {
        // HANDLE INITIALIZATION
        this.log("Bot started")
        this.once("ready", async () => {
            this.log("Bot is ready")
            this.applicationId = (await this.application?.fetch())?.id ?? "";
            this.log("Application ID fetched. Delaying augurReady")
            await this.delayStart().catch(error => this.errorHandler(error, "Augur Delay Start Function"))
            this.log("Delay complete. Loading modules.")
            // PRE-LOAD COMMANDS
            const moduleFolder = this.augurOptions?.commands || this.augurOptions?.modules
            if (moduleFolder) {
                const commandPath = path.resolve(require.main ? path.dirname(require.main.filename) : process.cwd(), moduleFolder);
                try {
                    const commandFiles = fs.readdirSync(commandPath).filter(f => f.endsWith(".js"));
                    for (const command of commandFiles) {
                        try {
                            this.moduleManager.register(path.resolve(commandPath, command));
                        } catch (error: any) {
                            this.errorHandler(error, `Error loading Augur Module ${command}`);
                        }
                    }
                } catch (error: any) {
                    this.errorHandler(error, `Error loading module names from ${commandPath}`);
                }
            }
            this.log("Augur is Ready")
            this.readyEvent();
            this.on("ready", this.readyEvent)
        });

        if (this.config.events.includes("messageCreate")) {
            this.on("messageCreate", async (message) => {
                if (("interactionMetadata" in message && message.interactionMetadata) || message.interaction) {
                    this.log("interaction message sent")
                    return;
                }
                this.log("message creation detected")
                let halt = false;
                if (this.moduleManager.events.has("messageCreate")) {
                    halt = await this.eventHandler("messageCreate", [message], message)
                    this.log(`message parsing halted: ${Boolean(halt)}`)
                }

                if (halt) return;

                try {
                    let parsed = await this.parse(message);
                    this.log(`message parsed: ${Boolean(parsed)}`)
                    if (parsed) this.moduleManager.commands.execute(message, parsed);
                } catch (error: any) {
                    this.errorHandler(error, message);
                }
            });
        }

        if (this.config.events.includes("messageUpdate")) {
            this.on("messageUpdate", async (old, message) => {
                if (("interactionMetadata" in message && message.interactionMetadata) || message.interaction) {
                    this.log("interaction message edit")
                    return;
                }
                this.log("messageUpdate detected")
                
                // fetch the message
                const newMessage = await this.fetchMsg(message);
                if (newMessage) message = newMessage;
                else return;

                const isEdited = (message.editedTimestamp ?? 0) > Date.now() - 30 * 60_000 && // filter old messages
                                 (old.pinned == null || old.pinned == message.pinned) // filter pins
                this.log(`message is ${isEdited ? "edited" : "not edited"}`)
                let halt = false;

                if (isEdited && this.moduleManager.events.has("messageEdit")) {
                    halt = await this.eventHandler("messageEdit", [old, message], message);
                    this.log(`message edit parsing halted: ${Boolean(halt)}`)
                }
                
                if (this.moduleManager.events.has("messageUpdate") && !halt) {
                    halt = await this.eventHandler("messageUpdate", [old, message], message)
                    this.log(`message parsing halted: ${Boolean(halt)}`)
                }

                if (halt || !isEdited) return;

                try {
                    const parsed = await this.parse(message);
                    this.log(`message parsed: ${Boolean(parsed)}`)
                    if (parsed) this.moduleManager.commands.execute(message, parsed);
                } catch (error: any) {
                    this.errorHandler(error, message);
                }
            });
        }

        this.on("interactionCreate", async (interaction) => {
            this.log("interaction creation detected")
            let halt = false;
            if (this.moduleManager.events.has("interactionCreate")) {
                halt = await this.eventHandler("interactionCreate", [interaction], interaction)
                this.log(`interactionCreate handling halted: ${Boolean(halt)}`)
            }

            if (halt) return;
            
            try {
                this.log("executing interaction as addInteraction")
                const id = (interaction.isCommand() || interaction.isAutocomplete()) ? interaction.commandId : interaction.customId
                await this.moduleManager.interactions.get(id)?.execute(interaction);
            } catch (error: any) {
                this.errorHandler(error, interaction);
            }
        });

        if (this.config.events.includes("messageReactionAdd")) {
            this.on("messageReactionAdd", async (reaction, user) => {
                this.log("reactionAdd detected")
                if (this.moduleManager.events.has("messageReactionAdd")) {
                    const newReact = await this.fetchReact(reaction);
                    if (newReact) reaction = newReact;
                    else return;

                    const newMessage = await this.fetchMsg(reaction.message);
                    if (newMessage) reaction.message = newMessage;
                    else return;

                    this.log("running all messageReactionAdd handlers")
                    await this.eventHandler("messageReactionAdd", [reaction, user], reaction.message)
                }
            });
        }

        const events = new Set(this.config?.events || []);
        events.delete("messageCreate");
        events.delete("messageUpdate");
        events.delete("interactionCreate");
        events.delete("messageReactionAdd");
        events.delete("ready");

        for (const event of events) {
            this.on(event, async (...args) => {
                this.log(`${event} detected`)
                if (this.moduleManager.events.has(event)) {
                    this.log(`handler(s) for ${event} found, trying now...`)
                    await this.eventHandler(event, args, (f) => `${event} Handler: ${f}`)
                }
            });
        }
    }
    constructor(config: BotConfig, options: AugurOptions = {}) {
        
        const intents = calculateIntents(config.events, config.getMessageContent, config.processDMs);

        if (!options.clientOptions) options.clientOptions = { intents };
        else if (!options.clientOptions.intents) options.clientOptions.intents = intents
        
        super(options.clientOptions as Discord.ClientOptions);

        this.moduleManager = new ModuleManager(this);
        
        this.augurOptions = options;
        this.config = config;
        this.db = (this.config.db?.model ? require(path.resolve((require.main ? path.dirname(require.main.filename) : process.cwd()), this.config.db.model)) : null);
        this.errorHandler = this.augurOptions.errorHandler || DEFAULTS.errorHandler;
        this.parse = this.augurOptions.parse || DEFAULTS.parse;
        this.commandExecution = this.augurOptions.commandExecution || DEFAULTS.commandExecution
        this.interactionExecution = this.augurOptions.interactionExecution || DEFAULTS.interactionExecution
        this.delayStart = this.augurOptions.delayStart || DEFAULTS.delayStart
        this.applicationId = ""
        this.debug = false
        this.start()
    }
    
    destroy() {
        this.log("client destroy called")
        try {
            this.moduleManager.unloadAll()
            this.log("all modules unloaded")
        } catch (error: any) {
            this.errorHandler(error, "Unload prior to destroying client.");
        }
        this.log("destroying client")
        return super.destroy();
    }
    login(token?: string) {
        this.log("logging in")
        return super.login(token || this.config?.token);
    }
    private getChannel: <A extends keyof Channels>(id: string, type: A, stringType: string) => Channels[A] | null = (id, type, stringType) => {
        const channel = this.channels.cache.get(id)
        if (!channel) return this.wrongTypeErr(id, stringType, "Undefined")
        if (channel.type != type) return this.wrongTypeErr(id, stringType, Discord.ChannelType[channel.type])
        return channel as Channels[typeof type]
    }
    wrongTypeErr (id: string, strType: string, expected: string) {
        this.log("Wrong type error")
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