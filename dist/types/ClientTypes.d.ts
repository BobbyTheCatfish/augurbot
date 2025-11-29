import { AugurCommand } from "../structures/AugurCommand";
import { AugurInteraction } from "../structures/AugurInteraction";
import { ErrorHandler, ParseFunction } from "./UtilTypes";
import Discord from "discord.js";
/** Standard configuration for the bot. Can be extended to include more properties of your choice, but that isn't reccomended since you won't get any type support. */
export type BotConfig = {
    events: (keyof Discord.ClientEvents)[];
    processDMs?: boolean;
    db?: {
        model: string;
    };
    token: string;
    ownerId: string;
    applicationId?: string;
    prefix?: string;
    strictTypes?: {
        channels: boolean;
    };
    getMessageContent?: boolean;
};
export type OptionalClientOptions = {
    intents?: Discord.BitFieldResolvable<Discord.GatewayIntentsString, number>;
};
/** Options for the client object */
export type AugurOptions = {
    clientOptions?: Omit<Discord.ClientOptions, "intents"> & OptionalClientOptions;
    errorHandler?: ErrorHandler;
    parse?: ParseFunction;
    commandExecution?: CommandExecution;
    interactionExecution?: InteractionExecution;
    delayStart?: () => Promise<any>;
    /**
     * @deprecated Use `modules` instead
     */
    commands?: string;
    modules?: string;
};
export type CommandExecution = (cmd: AugurCommand, message: Discord.Message, args: string[]) => Promise<any> | any;
export type InteractionExecution = (cmd: AugurInteraction, interaction: Discord.Interaction) => Promise<any> | any;
/** Function to run on module load */
export type InitFunction = (load: any) => any;
/** Function to run on module unload */
export type UnloadFunction = () => any;
/** Function to run a timeout on module load */
export type Clockwork = (client: Discord.Client) => NodeJS.Timeout;
export type InteractionTypes<K extends Discord.CacheType = Discord.CacheType> = {
    AutoComplete: Discord.AutocompleteInteraction<K>;
    Any: Discord.Interaction<K>;
    Button: Discord.ButtonInteraction<K>;
    CommandSlash: Discord.ChatInputCommandInteraction<K>;
    CommandBase: Discord.CommandInteraction<K>;
    ContextMessage: Discord.MessageContextMenuCommandInteraction<K>;
    ContextUser: Discord.UserContextMenuCommandInteraction<K>;
    ContextBase: Discord.ContextMenuCommandInteraction<K>;
    MessageComponent: Discord.MessageComponentInteraction<K>;
    Modal: Discord.ModalSubmitInteraction<K>;
    SelectMenuChannel: Discord.ChannelSelectMenuInteraction<K>;
    SelectMenuMentionable: Discord.MentionableSelectMenuInteraction<K>;
    SelectMenuRole: Discord.RoleSelectMenuInteraction<K>;
    SelectMenuString: Discord.StringSelectMenuInteraction<K>;
    SelectMenuUser: Discord.UserSelectMenuInteraction<K>;
};
export type NoAutoComplete<K extends Discord.CacheType = Discord.CacheType> = Omit<InteractionTypes<K>, "AutoComplete">;
export type DefaultInteraction<A extends keyof NoAutoComplete | undefined> = undefined extends A ? "CommandSlash" : A extends keyof NoAutoComplete ? A : "CommandSlash";
export type GuildInteraction<K extends keyof InteractionTypes<"cached">> = InteractionTypes<"cached">[K];
