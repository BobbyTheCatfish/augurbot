import { Collection, Client } from 'discord.js';
import { AugurModule } from '../structures/AugurModule';
export default class EventManager extends Collection<string, Collection<string, Function>> {
    client: Client;
    constructor(client: Client);
    register(load: AugurModule): this;
}
