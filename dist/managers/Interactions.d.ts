import { Collection, Client } from 'discord.js';
import { AugurInteraction } from '../structures/AugurInteraction';
import { AugurModule } from '../structures/AugurModule';
export default class InteractionManager extends Collection<string, AugurInteraction> {
    client: Client;
    constructor(client: Client);
    register(load: AugurModule): this;
}
