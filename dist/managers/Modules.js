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
                if (load.shared)
                    this.shared.set(path_1.default.basename(filepath), load.shared);
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
                this.shared.delete(path_1.default.basename(filepath));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kdWxlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYW5hZ2Vycy9Nb2R1bGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0EsZ0RBQXVCO0FBQ3ZCLDREQUEwQztBQUMxQywwREFBdUM7QUFDdkMsc0RBQW1DO0FBQ25DLGtFQUErQztBQUcvQyxNQUFxQixhQUFhO0lBUTlCLFlBQVksTUFBYztRQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksbUJBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLGtCQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGdCQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLHNCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELFFBQVEsQ0FBQyxJQUFZLEVBQUUsSUFBa0I7O1FBQ3JDLElBQUksSUFBSSxFQUFFLENBQUM7WUFDUCxJQUFJLFFBQVEsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQztnQkFDRCxNQUFNLElBQUksR0FBZ0IsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUU1QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUN6QixJQUFJLENBQUMsTUFBTSxH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