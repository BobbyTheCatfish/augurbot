"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AugurModule = void 0;
const discord_js_1 = require("discord.js");
const AugurCommand_1 = require("./AugurCommand");
const AugurInteraction_1 = require("./AugurInteraction");
/**
 * The main method of interacting with Discord. Add handlers for commands, events, timers, and more!
 */
class AugurModule {
    constructor() {
        this.commands = [];
        this.interactions = [];
        this.events = new discord_js_1.Collection();
        this.shared = new discord_js_1.Collection();
        this.config = {};
    }
    /**
     * Adds a message-based command. The message content intent is required for this to function.
     */
    addCommand(info) {
        this.commands.push(new AugurCommand_1.AugurCommand(info, this.client));
        return this;
    }
    /**
     * Runs a function when an event is triggered.
     *
     * **QUIRKS**
     *
     * Upon triggering an event, Augur itterates through all events of the given type until
     * - A) it runs out of that type of event
     * - B) An event returns a truthy value
     *
     * Augur will wait for one handler to finish before trying other handlers for the same event
     */
    addEvent(event, handler) {
        this.events.set(event, handler);
        return this;
    }
    /**
     * Adds a handler for a given interaction ID
     */
    addInteraction(info) {
        this.interactions.push(new AugurInteraction_1.AugurInteraction(info, this.client));
        return this;
    }
    /**
     * Used to share common functions or variables between modules without using hacky `module.exports` methods
     */
    addShared(identifier, toShare) {
        this.shared.set(identifier, { filepath: "", shared: toShare });
        return this;
    }
    /**
     * Runs a function on an interval. The client object is provided to the function.
     */
    setClockwork(clockwork) {
        this.clockwork = clockwork;
        return this;
    }
    /**
     * A function to be run when the module is reloaded.
     *
     * If the module was reloaded, the results of `setUnload` will be passed in as an argument.
     */
    setInit(init) {
        this.init = init;
        return this;
    }
    /**
     * Upon a module unload, the function will be run. The return value will be sent to `setInit` if the module is reloaded.
     */
    setUnload(unload) {
        this.unload = unload;
        return this;
    }
}
exports.AugurModule = AugurModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXVndXJNb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3RydWN0dXJlcy9BdWd1ck1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQ0FBZ0Q7QUFDaEQsaURBQStEO0FBQy9ELHlEQUEyRTtBQUkzRTs7R0FFRztBQUNILE1BQWEsV0FBVztJQWFwQjtRQUNJLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ25CLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSx1QkFBVSxFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLHVCQUFVLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNyQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxVQUFVLENBQXFDLElBQTRCO1FBQ3ZFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksMkJBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDeEQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVEOzs7Ozs7Ozs7O09BVUc7SUFDSCxRQUFRLENBQStCLEtBQVEsRUFBRSxPQUF5RDtRQUN0RyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsY0FBYyxDQUFpRixJQUFtQztRQUM5SCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLG1DQUFnQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNoRSxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTLENBQUMsVUFBa0IsRUFBRSxPQUFZO1FBQ3RDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDL0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsWUFBWSxDQUFDLFNBQWdDO1FBQ3pDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsT0FBTyxDQUFDLElBQWtCO1FBQ3RCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQVMsQ0FBQyxNQUFzQjtRQUM1QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0NBQ0o7QUF0RkQsa0NBc0ZDIn0=