import { Client } from 'discord.js'
import path from 'path'
import ClockworkManager from './Clockwork'
import CommandManager from './Commands'
import EventManager from './Events'
import InteractionManager from './Interactions'
import { AugurModule } from '../structures/AugurModule'

export default class ModuleManager {
    client: Client
    clockwork: ClockworkManager
    commands: CommandManager
    events: EventManager
    interactions: InteractionManager
    unloads: Map<string, Function>
    shared: Map<string, any>
    constructor(client: Client) {
        this.client = client;
        this.clockwork = new ClockworkManager(client);
        this.commands = new CommandManager(client);
        this.events = new EventManager(client);
        this.interactions = new InteractionManager(client);
        this.unloads = new Map();
        this.shared = new Map();
    }

    register(file: string, data?: AugurModule) {
        if (file) {
            let filepath = path.resolve(file);
            try {
                const load: AugurModule = require(filepath);

                load.config = this.client.config;
                load.db = this.client.db;
                load.client = this.client;
                load.filepath = filepath;

                // RUN INIT()
                load.init?.(data);
                
                // REGISTER CLOCKWORK
                this.clockwork.register(load);
                
                // REGISTER EVENT HANDLERS
                this.events.register(load);

                // REGISTER COMMANDS & ALIASES
                this.commands.register(load);

                // REGISTER INTERACTIONS
                this.interactions.register(load);

                // REGISTER SHARED FUNCTIONS/VARIABLES
                if (load.shared) this.shared.set(path.basename(filepath), load.shared)

                // REGISTER UNLOAD FUNCTION
                if (load.unload) this.unloads.set(filepath, load.unload);

            } catch (error: any) {
                this.client.errorHandler(error, `Register: ${filepath}`);
            }
        }
        return this;
    }

    reload(file: string) {
        if (file) {
            let filepath = path.resolve(file);
            try {
                let unloadData = this.unload(filepath);
                this.register(filepath, unloadData);
            } catch (error: any) {
                this.client.errorHandler(error, `Reload: ${filepath}`)
            }
        }
        return this;
    }

    unload(file: string) {
        if (file) {
            let filepath = path.resolve(file);
            try {
                // Clear Clockwork
                this.clockwork.unload(filepath);

                // Clear Event Handlers
                for (let [event, handlers] of this.events) {
                    handlers.delete(filepath);
                }

                // Clear Interaction Handlers
                for (let [interactionId, interaction] of this.interactions) {
                    if (interaction.filepath == filepath) this.interactions.delete(interactionId);
                }

                // Unload
                let unloadData;
                if (this.unloads.has(filepath)) {
                    unloadData = (this.unloads.get(filepath) ?? (() => {}))();
                    this.unloads.delete(filepath);
                }

                // Clear Commands and Aliases
                for (let [name, command] of this.commands) {
                    if (command.filepath == filepath) this.commands.delete(name);
                }
                for (let [alias, command] of this.commands.aliases) {
                    if (command.filepath == filepath) this.commands.aliases.delete(alias);
                }

                // Clear Shared Functions/variables
                this.shared.delete(path.basename(filepath));

                // Clear Require Cache
                delete require.cache[require.resolve(filepath)];

                return unloadData;
            } catch (error: any) {
                this.client.errorHandler(error, `Unload: ${filepath}`);
            }
        }
        return this;
    }

    unloadAll() {
        // Remove all clockwork intervals
        for (const [file, interval] of this.clockwork) {
            clearInterval(interval);
            this.clockwork.delete(file);
        }

        // Clear Event Handlers
        for (let [event, handlers] of this.events) {
            handlers.clear();
        }

        // Unload all files
        for (const [file, unload] of this.unloads) {
            try {
                unload();
            } catch (error: any) {
                this.client.errorHandler(error, `Unload: ${file}`);
            }
        }

        // Clear Commands and Aliases
        this.commands.clear();
        this.commands.aliases.clear();

        // Clear Interactions
        this.interactions.clear();

        // Clear Shared Functions/Variables
        this.shared.clear();

        return this;
    }
}