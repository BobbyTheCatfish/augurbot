import Discord from "discord.js";
import { AugurCommand } from "./AugurCommand";
import { AugurInteraction } from "./AugurInteraction";
/** DEFAULT FUNCTIONS*/
declare const DEFAULTS: {
    errorHandler: (error: Error | string, message?: any) => void;
    parse: (message: Discord.Message) => Promise<{
        command: string;
        suffix: string;
        params: string[];
    } | null>;
    commandExecution: (cmd: AugurCommand, message: Discord.Message, args: string[]) => Promise<any>;
    interactionExecution: (cmd: AugurInteraction, interaction: Discord.Interaction) => Promise<any>;
    clean: (message: Discord.Message) => Promise<void>;
    delayStart: () => Promise<void>;
};
export default DEFAULTS;
