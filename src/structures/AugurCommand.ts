import Discord from "discord.js"
import { GuildDmMessage, opBool } from "../types/UtilTypes"

export type AugurCommandInfo<G extends opBool, D extends opBool> = {
    parseParams?: boolean
    category?: string
    name: string
    aliases?: string[]
    syntax?: string
    description?: string
    info?: string
    hidden?: boolean
    enabled?: boolean
    userPermissions?: (Discord.PermissionResolvable)[]
    permissions?: (message: Discord.Message<GuildDmMessage<G,D>>) => Promise<boolean | null | undefined> | boolean | null | undefined
    options?: any
    process: (message: Discord.Message<GuildDmMessage<G,D>>, ...args: string[]) => Promise<any> | any
    onlyOwner?: boolean
    onlyGuild?: G
    onlyDm?: D
}

export class AugurCommand {
    filepath!: string
    client: Discord.Client
    parseParams: boolean
    category: string
    name: string
    aliases: string[]
    syntax: string
    description: string
    info: string
    hidden: boolean
    enabled: boolean
    userPermissions: (Discord.PermissionResolvable)[]
    permissions: (message: Discord.Message) => Promise<boolean | null | undefined> | boolean | null | undefined
    options: any
    process: (message: Discord.Message, ...args: string[]) => any
    onlyOwner: boolean
    onlyGuild: boolean
    onlyDm: boolean

    constructor(info: AugurCommandInfo<any, any>, client: Discord.Client) {
        if (!info.name || !info.process) {
            throw new Error("Commands must have the `name` and `process` properties");
        }
        this.name = info.name;
        this.aliases = info.aliases ?? [];
        this.syntax = info.syntax ?? "";
        this.description = info.description ?? "";
        this.info = info.info ?? this.description;
        this.hidden = info.hidden ?? false;
        this.category = info.category ?? "General";
        this.enabled = info.enabled ?? true;
        this.permissions = info.permissions || (() => true);
        this.userPermissions = info.userPermissions ?? [];
        this.parseParams = info.parseParams ?? false;
        this.options = info.options ?? {};
        this.process = info.process;
        this.onlyOwner = info.onlyOwner || false;
        this.onlyGuild = info.onlyGuild || false;
        this.onlyDm = info.onlyDm || false;
        this.client = client;
    }

    async execute(message: Discord.Message, args: string[]) {
        this.client.commandExecution(this, message, args)
    }
}