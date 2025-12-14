import { ChatInputCommandInteraction } from "discord.js";

type InGuild = boolean | undefined;

type CommandInteraction<T extends InGuild> = ChatInputCommandInteraction<true extends T ? "cached" : undefined extends T ? "cached" : undefined>

type SubCommandHandler<T extends InGuild> = (interaction: CommandInteraction<T>) => unknown

type SubcommandOptions<T extends InGuild> = {
    subcommand: string;
    subcommandGroup?: string;
    inGuild?: T
} | string;

class SubCommand<T extends InGuild> {
    subcommand: string;
    subcommandGroup?: string;
    inGuild?: T
    handler: SubCommandHandler<T>;

    constructor(options: SubcommandOptions<T>, handler: SubCommandHandler<T>) {
        if (typeof options === "string") {
            this.subcommand = options;
        } else {
            this.subcommand = options.subcommand;
            this.subcommandGroup = options.subcommandGroup;
            this.inGuild = options.inGuild
        }
        this.handler = handler;
    }

    execute(interaction: CommandInteraction<T>) {
        try {
            this.handler(interaction);
        } catch (error) {
            interaction.client.errorHandler(error as Error, interaction);
        }
    }
}

class SubCommandSwitch<T extends InGuild> {
    handlers: SubCommand<T>[];

    constructor(handlers: SubCommand<T>[]) {
        this.handlers = handlers;
    }

    execute(interaction: CommandInteraction<T>) {
        const subcommand = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup() || undefined;

        for (const handler of this.handlers) {
            if (handler.subcommand === subcommand) {
                if (!handler.subcommandGroup || handler.subcommandGroup === group) {
                    handler.execute(interaction);
                    break;
                }
            }
        }
    }
}

export default { SubCommand, SubCommandSwitch }