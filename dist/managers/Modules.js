"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const Clockwork_1 = __importDefault(require("./Clockwork"));
const Commands_1 = __importDefault(require("./Commands"));
const Events_1 = __importDefault(require("./Events"));
const Interactions_1 = __importDefault(require("./Interactions"));
class ModuleManager {
    constructor(client) {
        this.client = client;
        this.clockwork = new Clockwork_1.default(client);
        this.commands = new Commands_1.default(client);
        this.events = new Events_1.default(client);
        this.interactions = new Interactions_1.default(client);
        this.unloads = new Map();
        this.shared = new Map();
    }
    register(file, data) {
        var _a;
        if (file) {
            let filepath = path_1.default.resolve(file);
            try {
                const load = require(filepath);
                load.config = this.client.config;
                load.db = this.client.db;
                load.client = this.client;
                load.filepath = filepath;
                // RUN INIT()
                (_a = load.init) === null || _a === void 0 ? void 0 : _a.call(load, data);
                // REGISTER CLOCKWORK
                this.clockwork.register(load);
                // REGISTER EVENT HANDLERS
                this.events.register(load);
                // REGISTER COMMANDS & ALIASES
                this.commands.register(load);
                // REGISTER INTERACTIONS
                this.interactions.register(load);
                // REGISTER SHARED FUNCTIONS/VARIABLES
                for (const [key, share] of load.shared) {
                    const existing = this.shared.get(key);
                    if (existing)
                        this.client.errorHandler(`Duplicate Shared Identifier: ${key}`, `Identifier ${key} already registered at ${existing.filepath}. It is being overwritten by ${load.filepath}.`);
                    this.shared.set(key, share);
                }
                // REGISTER UNLOAD FUNCTION
                if (load.unload)
                    this.unloads.set(filepath, load.unload);
            }
            catch (error) {
                this.client.errorHandler(error, `Register: ${filepath}`);
            }
        }
        return this;
    }
    reload(file) {
        if (file) {
            let filepath = path_1.default.resolve(file);
            try {
                let unloadData = this.unload(filepath);
                this.register(filepath, unloadData);
            }
            catch (error) {
                this.client.errorHandler(error, `Reload: ${filepath}`);
            }
        }
        return this;
    }
    unload(file) {
        var _a;
        if (file) {
            let filepath = path_1.default.resolve(file);
            try {
                // Clear Clockwork
                this.clockwork.unload(filepath);
                // Clear Event Handlers
                for (let [event, handlers] of this.events) {
                    handlers.delete(filepath);
                }
                // Clear Interaction Handlers
                for (let [interactionId, interaction] of this.interactions) {
                    if (interaction.filepath == filepath)
                        this.interactions.delete(interactionId);
                }
                // Unload
                let unloadData;
                if (this.unloads.has(filepath)) {
                    unloadData = ((_a = this.unloads.get(filepath)) !== null && _a !== void 0 ? _a : (() => { }))();
                    this.unloads.delete(filepath);
                }
                // Clear Commands and Aliases
                for (let [name, command] of this.commands) {
                    if (command.filepath == filepath)
                        this.commands.delete(name);
                }
                for (let [alias, command] of this.commands.aliases) {
                    if (command.filepath == filepath)
                        this.commands.aliases.delete(alias);
                }
                // Clear Shared Functions/variables
                for (let [identifier, funcObject] of this.shared) {
                    if (funcObject.filepath === filepath)
                        this.shared.delete(identifier);
                }
                // Clear Require Cache
                delete require.cache[require.resolve(filepath)];
                return unloadData;
            }
            catch (error) {
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
            }
            catch (error) {
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
exports.default = ModuleManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kdWxlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYW5hZ2Vycy9Nb2R1bGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBRUEsZ0RBQXVCO0FBQ3ZCLDREQUEwQztBQUMxQywwREFBdUM7QUFDdkMsc0RBQW1DO0FBQ25DLGtFQUErQztBQUcvQyxNQUFxQixhQUFhO0lBUTlCLFlBQVksTUFBYztRQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksbUJBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLGtCQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGdCQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLHNCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELFFBQVEsQ0FBQyxJQUFZLEVBQUUsSUFBa0I7O1FBQ3JDLElBQUksSUFBSSxFQUFFLENBQUM7WUFDUCxJQUFJLFFBQVEsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQztnQkFDRCxNQUFNLElBQUksR0FBZ0IsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUU1QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUN6QixJQUFJLENBQUMsTUFBTSxH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