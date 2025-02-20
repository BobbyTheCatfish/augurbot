import Discord from "discord.js"
import { DefaultInteraction, NoAutoComplete } from "../types/ClientTypes"
import { GuildDmInteraction, opBool } from "../types/UtilTypes"
export type AugurInteractionInfo<K extends keyof NoAutoComplete | undefined, G extends opBool, D extends opBool> = {
    id: string
    name?: string
    guildId?: string
    syntax?: string
    description?: string
    info?: string
    hidden?: boolean
    category?: string
    enabled?: boolean
    options?: any
    type?: K
    userPermissions?: (Discord.PermissionResolvable)[]
    permissions?: (interaction: NoAutoComplete<GuildDmInteraction<G, D>>[DefaultInteraction<K>]) => Promise<boolean | null | undefined> | boolean | null | undefined
    autocomplete?: (interaction: Discord.AutocompleteInteraction<GuildDmInteraction<G, D>>) => Promise<any> | any
    process: (interaction: NoAutoComplete<GuildDmInteraction<G, D>>[DefaultInteraction<K>]) => Promise<any> | any
    onlyOwner?: boolean
    onlyGuild?: G
    onlyDm?: D
}

export class AugurInteraction {
    filepath!: string
    id: string
    name: string
    guildId?: string
    syntax: string
    description: string
    info: string
    hidden: boolean
    category: string
    enabled: boolean
    options: any
    type: string
    userPermissions: (Discord.PermissionResolvable)[]
    permissions: (int: any) => Promise<boolean | null | undefined> | boolean | null | undefined
    process: (int: any) => Promise<any> | any
    autocomplete: (int: Discord.AutocompleteInteraction) => Promise<any> | any
    onlyOwner: boolean
    onlyGuild: boolean
    onlyDm: boolean
    client: Discord.Client
    constructor(info: AugurInteractionInfo<any, any, any>, client: Discord.Client) {
        if (!info.id || !info.process) {
            throw new Error("Commands must have the `id` and `process` properties");
        }
        this.id = info.id;
        this.name = info.name ?? info.id;
        this.guildId = info.guildId;
        this.syntax = info.syntax ?? "";
        this.description = info.description ?? "";
        this.info = info.info ?? this.description;
        this.hidden = info.hidden ?? false;
        this.category = info.category ?? "";
        this.enabled = info.enabled ?? true;
        this.options = info.options ?? {};
        this.type = info.type ?? "CommandSlash"
        this.userPermissions = info.userPermissions ?? [];
        this.permissions = info.permissions ?? (async () => true);
        this.process = info.process;
        this.autocomplete = info.autocomplete || (() => {})
        this.onlyOwner = info.onlyOwner || false;
        this.onlyGuild = info.onlyGuild || false;
        this.onlyDm = info.onlyDm || false;
        this.client = client;
    }

    async execute(interaction: Discord.Interaction) {
        this.client.interactionExecution(this, interaction)
    }
}