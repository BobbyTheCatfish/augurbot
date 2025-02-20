import { Collection, Client, Message } from 'discord.js'
import { Parsed } from "../types/UtilTypes"
import path from 'path'
import { AugurCommand } from '../structures/AugurCommand';
import { AugurModule } from '../structures/AugurModule';

export default class CommandManager extends Collection<string, AugurCommand> {
    client: Client;
    aliases: Collection<string, AugurCommand>;
    commandCount: number;
    constructor(client: Client) {
        super();
        this.client = client;
        this.aliases = new Collection();
        this.commandCount = 0;
    }
    async execute(message: Message, parsed: Parsed) {
        try {
            let { command, suffix, params } = parsed;
            let commandGroup: Collection<string, AugurCommand>;
            if (this.has(command)) commandGroup = this;
            else if (this.aliases.has(command)) commandGroup = this.aliases;
            else return;

            this.commandCount++;
            let cmd = commandGroup.get(command);
            if (cmd?.parseParams)
                return cmd.execute(message, params);
            else
                return cmd?.execute(message, [suffix]);
        } catch (error: any) {
            return this.client.errorHandler(error, message);
        }
    }

    register(load: AugurModule) {
        for (const command of load.commands) {
            try {
                command.filepath = load.filepath;
                command.client = load.client;
                if (!command.category) command.category = path.basename(command.filepath, ".js");

                const existing = this.get(command.name.toLowerCase());
                if (existing) this.client.errorHandler(`Duplicate Command Name: ${command.name}`, `Command name ${command.name} already registered in \`${existing.filepath}\`. It is being overwritten.`)
                this.set(command.name.toLowerCase(), command);

                for (let alias of command.aliases) {
                    alias = alias.toLowerCase();
                    const existing = this.aliases.get(alias);
                    if (existing) this.client.errorHandler(`Duplicate Command Alias: ${alias}`, `Command alias ${alias} already registered in \`${existing.filepath}\`. It is being overwritten.`)
                    this.aliases.set(alias, command);
                }
            } catch (error: any) {
                this.client.errorHandler(error, `Register command "${command.name}" in ${load.filepath}`);
            }
        }
        return this;
    }
}