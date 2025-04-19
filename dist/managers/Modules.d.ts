import { Client } from 'discord.js';
import ClockworkManager from './Clockwork';
import CommandManager from './Commands';
import EventManager from './Events';
import InteractionManager from './Interactions';
import { AugurModule } from '../structures/AugurModule';
export default class ModuleManager {
    client: Client;
    clockwork: ClockworkManager;
    commands: CommandManager;
    events: EventManager;
    interactions: InteractionManager;
    unloads: Map<string, Function>;
    shared: Map<string, any>;
    constructor(client: Client);
    register(file: string, data?: AugurModule): this;
    reload(file: string): this;
    unload(file: string): any;
    unloadAll(): this;
}
