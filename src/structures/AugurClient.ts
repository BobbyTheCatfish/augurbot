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
                if (message.interactionMetadata) {
                    this.log("interaction message sent")
                    return;
                }
                this.log("message creation detected")
                let halt = false;
                if (this.moduleManager.events.has("messageCreate")) {
                    let i = 0;
                    const events = Array.from(this.moduleManager.events.get("messageCreate") ?? []);
                    while (i < events.length && !halt) {
                        const [filepath, handler] = events[i]

                        try {
                            halt = await handler(message)
                            i++;
                        } catch (error: any) {
                            halt = true;
                            this.errorHandler(error, message);
                            break;
                        }
                    }
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
                if (message.interactionMetadata) {
                    this.log("interaction message edit")
                    return;
                }
                this.log("messageUpdate detected")
                const isEdited = (message.editedTimestamp ?? 0) > Date.now() - 60 * 1000 && // filter cdn updates
                    (old.pinned == null || old.pinned == message.pinned) // filter pins
                this.log(`message is edited: ${isEdited}`)
                let halt = false;

                if (isEdited && this.moduleManager.events.has("messageEdit")) {
                    this.log("message being handled as edited")
                    const newMessage = await this.fetchMsg(message);
                    if (newMessage) message = newMessage;
                    else return;

                    let i = 0;
                    const events = Array.from(this.moduleManager.events.get("messageEdit")?.values() ?? []);
                    while (i < events.length && !halt) {
                        try {
                            const handler = events[i]
                            halt = await handler(old, message)
                            i++;
                        } catch (error: any) {
                            this.errorHandler(error, message);
                            halt = true;
                            break;
                        }
                    }
                    this.log(`message edit parsing halted: ${Boolean(halt)}`)
                }
                
                if (this.moduleManager.events.has("messageUpdate") && !halt) {
                    this.log("message being handled as updated")
                    const newMessage = await this.fetchMsg(message);
                    if (newMessage) message = newMessage;
                    else return;

                    let i = 0;
                    const events = Array.from(this.moduleManager.events.get("messageUpdate")?.values() ?? []);
                    while (i < events.length && !halt) {
                        try {
                            const handler = events[i]
                            halt = await handler(old, message)
                            i++;
                        } catch (error: any) {
                            this.errorHandler(error, message);
                            halt = true;
                            break;
                        }
                    }
                    this.log(`message parsing halted: ${Boolean(halt)}`)
                }

                if (halt || !isEdited) return;

                try {
                    const newMessage = await this.fetchMsg(message);
                    if (newMessage) message = newMessage;
                    else return;

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
                let i = 0;
                const events = Array.from(this.moduleManager.events.get("interactionCreate") ?? []);
                while (i < events.length && !halt) {
                    const [file, handler] = events[i]
                    try {
                        halt = await handler(interaction)
                        i++;
                    } catch (error: any) {
                        this.errorHandler(error, `interactionCreate Handler: ${file}`);
                        halt = true;
                        break;
                    }
                }
                this.log(`interactionCreate handling halted: ${Boolean(halt)}`)
            }
            try {
                this.log("executing interaction as addInteraction")
                if (!halt) await this.moduleManager.interactions.get(
                    interaction.isCommand() || interaction.isAutocomplete() ? interaction.commandId
                    : interaction.customId
                )?.execute(interaction);
            } catch (error: any) {
                this.errorHandler(error, `Interaction Processing: ${interaction.id}`);
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
                    let i = 0;
                    const events = Array.from(this.moduleManager.events.get("messageReactionAdd") ?? []);
                    while (i < events.length) {
                        const [file, handler] = events[i]
                        try {
                            if (await handler(reaction, user)) break;
                            i++;
                        } catch (error: any) {
                            this.errorHandler(error, `messageReactionAdd Handler: ${file}`);
                            break;
                        }
                    }
                }
            });
        }

        let events = (this.config?.events || [])
            .filter(event => ![
                "message",
                "messageCreate",
                "messageUpdate",
                "interactionCreate",
                "messageReactionAdd",
                "ready"
            ].includes(event));

        for (const event of events) {
            this.on(event, async (...args) => {
                this.log(`${event} detected`)
                if (this.moduleManager.events.has(event)) {
                    this.log(`handler(s) for ${event} found, trying now...`)
                    let i = 0;
                    const events = Array.from(this.moduleManager.events.get(event) ?? []);
                    while (i < events.length) {
                        const [file, handler] = events[i]
                        try {
                            if (await handler(...args)) break;
                            i++;
                        } catch (error: any) {
                            this.errorHandler(error, `${event} Handler: ${file}`);
                            break;
                        }
                    }
                }
            });
        }
    }
    constructor(config: BotConfig, options: AugurOptions = {}) {
        
        const intents = calculateIntents(config.events, config.processDMs);

        if (!options.clientOptions) options.clientOptions = {
                intents
        };
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