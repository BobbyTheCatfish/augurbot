import { Collection, Client } from 'discord.js'
import { AugurModule } from '../structures/AugurModule';

export default class ClockworkManager extends Collection<string, NodeJS.Timeout> {
    client: Client
    constructor(client: Client) {
        super();
        this.client = client;
    }

    register(load: AugurModule) {
        if (load.clockwork) this.set(load.filepath, load.clockwork(this.client));
        return this;
    }

    unload(filepath: string) {
        if (this.has(filepath)) {
            clearInterval(this.get(filepath));
            this.delete(filepath);
        }
        return this;
    }
}