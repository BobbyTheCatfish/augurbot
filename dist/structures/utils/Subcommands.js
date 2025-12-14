"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SubCommand {
    constructor(options, handler) {
        if (typeof options === "string") {
            this.subcommand = options;
        }
        else {
            this.subcommand = options.subcommand;
            this.subcommandGroup = options.subcommandGroup;
            this.inGuild = options.inGuild;
        }
        this.handler = handler;
    }
    execute(interaction) {
        try {
            this.handler(interaction);
        }
        catch (error) {
            interaction.client.errorHandler(error, interaction);
        }
    }
}
class SubCommandSwitch {
    constructor(handlers) {
        this.handlers = handlers;
    }
    execute(interaction) {
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
exports.default = { SubCommand, SubCommandSwitch };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3ViY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc3RydWN0dXJlcy91dGlscy9TdWJjb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWNBLE1BQU0sVUFBVTtJQU1aLFlBQVksT0FBNkIsRUFBRSxPQUE2QjtRQUNwRSxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDO1FBQzlCLENBQUM7YUFBTSxDQUFDO1lBQ0osSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQztZQUMvQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUE7UUFDbEMsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQzNCLENBQUM7SUFFRCxPQUFPLENBQUMsV0FBa0M7UUFDdEMsSUFBSSxDQUFDO1lBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNqRSxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBRUQsTUFBTSxnQkFBZ0I7SUFHbEIsWUFBWSxRQUF5QjtRQUNqQyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztJQUM3QixDQUFDO0lBRUQsT0FBTyxDQUFDLFdBQWtDO1FBQ3RDLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDdkQsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLFNBQVMsQ0FBQztRQUVwRSxLQUFLLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQyxJQUFJLE9BQU8sQ0FBQyxVQUFVLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxJQUFJLE9BQU8sQ0FBQyxlQUFlLEtBQUssS0FBSyxFQUFFLENBQUM7b0JBQ2hFLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQzdCLE1BQU07Z0JBQ1YsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBRUQsa0JBQWUsRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQSJ9