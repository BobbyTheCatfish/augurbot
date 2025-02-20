import Discord from "discord.js";
import AugurClient from './structures/AugurClient';
import { AugurModule } from "./structures/AugurModule";
import ModuleManager from "./managers/Modules";
import { BotConfig, AugurOptions, CommandExecution, InteractionExecution, GuildInteraction } from "./types/ClientTypes";
import { ErrorHandler, Parsed, ParseFunction } from "./types/UtilTypes";
import DEFAULTS from "./structures/defaults";
declare module 'discord.js' {
    interface Client {
        config: BotConfig;
        augurOptions: AugurOptions;
        moduleManager: ModuleManager;
        /** @deprecated Probably best to implement database stuff yourself. Removing in the next major version. */
        db?: any;
        errorHandler: ErrorHandler;
        parse: ParseFunction;
        commandExecution: CommandExecution;
        interactionExecution: InteractionExecution;
        delayStart: () => Promise<any>;
        applicationId: string;
        getTextChannel(id: string): Discord.TextChannel | null;
        getDmChannel(id: string): Discord.DMChannel | null;
        getGroupDmChannel(id: string): Discord.PartialGroupDMChannel | null;
        getVoiceChannel(id: string): Discord.VoiceChannel | null;
        getCategoryChannel(id: string): Discord.CategoryChannel | null;
        getNewsChannel(id: string): Discord.NewsChannel | null;
        getAnnouncementsThread(id: string): Discord.PublicThreadChannel | null;
        getPublicThread(id: string): Discord.PublicThreadChannel | null;
        getPrivateThread(id: string): Discord.PrivateThreadChannel | null;
        getStage(id: string): Discord.StageChannel | null;
        getDirectory(id: string): Discord.DirectoryChannel | null;
        getForumChannel(id: string): Discord.ForumChannel | null;
    }
}
/**************
 **  EXPORTS  **
 **************/
export { AugurClient, AugurModule as Module, Parsed as parsed, BotConfig, GuildInteraction, DEFAULTS as defaults, };
