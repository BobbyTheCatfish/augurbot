import Discord, { Message } from "discord.js";
export type Parsed = {
    command: string;
    suffix: string;
    params: string[];
};
export type ClientEvents = Omit<Discord.ClientEvents, "messageUpdate"> & {
    messageUpdate: [oldMessage: Message, newMessage: Message];
    messageEdit: [oldMessage: Message, newMessage: Message];
};
export type ErrorHandler = (error: Error | string, message?: Message | Discord.PartialMessage | Discord.Interaction | string) => void;
export type ParseFunction = (message: Discord.Message) => Promise<Parsed | null> | Parsed | null;
export type opBool = boolean | undefined;
export type GuildDmMessage<G extends opBool, D extends opBool> = undefined extends G ? undefined extends D ? boolean : true extends D ? false : boolean : true extends G ? true : boolean;
export type GuildDmInteraction<G extends opBool, D extends opBool> = GuildDmMessage<G, D> extends true ? "cached" : Discord.CacheType;
