/// <reference types="node" />
import { Collection, Client } from 'discord.js';
import { AugurModule } from '../structures/AugurModule';
export default class ClockworkManager extends Collection<string, NodeJS.Timeout> {
    client: Client;
    constructor(client: Client);
    register(load: AugurModule): this;
    unload(filepath: string): this;
}
