import { Collection, Client, Message } from 'discord.js';
import { Parsed } from "../types/UtilTypes";
import { AugurCommand } from '../structures/AugurCommand';
import { AugurModule } from '../structures/AugurModule';
export default class CommandManager extends Collection<string, AugurCommand> {
    client: Client;
    aliases: Collection<string, AugurCommand>;
    commandCount: number;
    constructor(client: Client);
    execute(message: Message, parsed: Parsed): Promise<void>;
    register(load: AugurModule): this;
}
