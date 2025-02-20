import { Collection, Client } from 'discord.js'
import { AugurInteraction } from '../structures/AugurInteraction';
import { AugurModule } from '../structures/AugurModule';

export default class InteractionManager extends Collection<string, AugurInteraction> {
    client: Client
    constructor(client: Client) {
        super();
        this.client = client;
    }

    register(load: AugurModule) {
        for (const interaction of load.interactions) {
            try {
                interaction.filepath = load.filepath;
                interaction.client = load.client
                const existing = this.get(interaction.id);
                if (existing) this.client.errorHandler(`Duplicate Interaction ID: ${interaction.id}`, `Interaction id ${interaction.id} already registered in \`${existing.filepath}\`. It is being overwritten.`);
                this.set(interaction.id, interaction);
            } catch (error: any) {
                this.client.errorHandler(error, `Register interaction "${interaction.name}" in guild ${interaction.guildId} in ${load.filepath}`);
            }
        }
        return this;
    }
}