import { Collection, Client } from 'discord.js'
import { AugurModule } from '../structures/AugurModule';

export default class EventManager extends Collection<string, Collection<string, Function>> {
    client: Client
    constructor(client: Client) {
        super();
        this.client = client;
    }

    register(load: AugurModule) {
        for (const [event, handler] of load.events) {
            this.ensure(event, () => new Collection())
                .set(load.filepath, handler)
        }
        return this;
    }
}