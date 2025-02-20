"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class InteractionManager extends discord_js_1.Collection {
    constructor(client) {
        super();
        this.client = client;
    }
    register(load) {
        for (const interaction of load.interactions) {
            try {
                interaction.filepath = load.filepath;
                interaction.client = load.client;
                const existing = this.get(interaction.id);
                if (existing)
                    this.client.errorHandler(`Duplicate Interaction ID: ${interaction.id}`, `Interaction id ${interaction.id} already registered in \`${existing.filepath}\`. It is being overwritten.`);
                this.set(interaction.id, interaction);
            }
            catch (error) {
                this.client.errorHandler(error, `Register interaction "${interaction.name}" in guild ${interaction.guildId} in ${load.filepath}`);
            }
        }
        return this;
    }
}
exports.default = InteractionManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hbmFnZXJzL0ludGVyYWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUErQztBQUkvQyxNQUFxQixrQkFBbUIsU0FBUSx1QkFBb0M7SUFFaEYsWUFBWSxNQUFjO1FBQ3RCLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDekIsQ0FBQztJQUVELFFBQVEsQ0FBQyxJQUFpQjtRQUN0QixLQUFLLE1BQU0sV0FBVyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUM7Z0JBQ0QsV0FBVyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUNyQyxXQUFXLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUE7Z0JBQ2hDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMxQyxJQUFJLFFBQVE7b0JBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsNkJBQTZCLFdBQVcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxrQkFBa0IsV0FBVyxDQUFDLEVBQUUsNEJBQTRCLFFBQVEsQ0FBQyxRQUFRLDhCQUE4QixDQUFDLENBQUM7Z0JBQ25NLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLHlCQUF5QixXQUFXLENBQUMsSUFBSSxjQUFjLFdBQVcsQ0FBQyxPQUFPLE9BQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDdEksQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0NBQ0o7QUFyQkQscUNBcUJDIn0=