import { ChatInputCommandInteraction } from "discord.js";
type InGuild = boolean | undefined;
type CommandInteraction<T extends InGuild> = ChatInputCommandInteraction<true extends T ? "cached" : undefined extends T ? "cached" : undefined>;
type SubCommandHandler<T extends InGuild> = (interaction: CommandInteraction<T>) => unknown;
type SubcommandOptions<T extends InGuild> = {
    subcommand: string;
    subcommandGroup?: string;
    inGuild?: T;
} | string;
declare class SubCommand<T extends InGuild> {
    subcommand: string;
    subcommandGroup?: string;
    inGuild?: T;
    handler: SubCommandHandler<T>;
    constructor(options: SubcommandOptions<T>, handler: SubCommandHandler<T>);
    execute(interaction: CommandInteraction<T>): void;
}
declare class SubCommandSwitch<T extends InGuild> {
    handlers: SubCommand<T>[];
    constructor(handlers: SubCommand<T>[]);
    execute(interaction: CommandInteraction<T>): void;
}
declare const _default: {
    SubCommand: typeof SubCommand;
    SubCommandSwitch: typeof SubCommandSwitch;
};
export default _default;
