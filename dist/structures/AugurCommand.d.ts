import Discord from "discord.js";
import { GuildDmMessage, opBool } from "../types/UtilTypes";
export type AugurCommandInfo<G extends opBool, D extends opBool> = {
    parseParams?: boolean;
    category?: string;
    name: string;
    aliases?: string[];
    syntax?: string;
    description?: string;
    info?: string;
    hidden?: boolean;
    enabled?: boolean;
    userPermissions?: (Discord.PermissionResolvable)[];
    permissions?: (message: Discord.Message<GuildDmMessage<G, D>>) => Promise<boolean | null | undefined> | boolean | null | undefined;
    options?: any;
    process: (message: Discord.Message<GuildDmMessage<G, D>>, ...args: string[]) => Promise<any> | any;
    onlyOwner?: boolean;
    onlyGuild?: G;
    onlyDm?: D;
};
export declare class AugurCommand {
    filepath: string;
    client: Discord.Client;
    parseParams: boolean;
    category: string;
    name: string;
    aliases: string[];
    syntax: string;
    description: string;
    info: string;
    hidden: boolean;
    enabled: boolean;
    userPermissions: (Discord.PermissionResolvable)[];
    permissions: (message: Discord.Message) => Promise<boolean | null | undefined> | boolean | null | undefined;
    options: any;
    process: (message: Discord.Message, ...args: string[]) => any;
    onlyOwner: boolean;
    onlyGuild: boolean;
    onlyDm: boolean;
    constructor(info: AugurCommandInfo<any, any>, client: Discord.Client);
    execute(message: Discord.Message, args: string[]): Promise<void>;
}
