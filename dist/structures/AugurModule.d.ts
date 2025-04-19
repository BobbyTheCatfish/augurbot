import Discord, { Collection } from "discord.js";
import { AugurCommand, AugurCommandInfo } from "./AugurCommand";
import { AugurInteraction, AugurInteractionInfo } from "./AugurInteraction";
import { BotConfig, Clockwork, InitFunction, NoAutoComplete, UnloadFunction } from "../types/ClientTypes";
import { ClientEvents, opBool } from "../types/UtilTypes";
/**
 * The main method of interacting with Discord. Add handlers for commands, events, timers, and more!
 */
export declare class AugurModule {
    commands: AugurCommand[];
    interactions: AugurInteraction[];
    events: Collection<string, Function>;
    shared: any;
    config: BotConfig | {};
    client: Discord.Client;
    clockwork?: Clockwork;
    init?: InitFunction;
    unload?: UnloadFunction;
    filepath: string;
    /** @deprecated Probably best to implement database stuff yourself. Removing in the next major version. */
    db?: any;
    constructor();
    /**
     * Adds a message-based command. The message content intent is required for this to function.
     */
    addCommand<G extends opBool, D extends opBool>(info: AugurCommandInfo<G, D>): this;
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
    addEvent<K extends keyof ClientEvents>(event: K, handler: (...args: ClientEvents[K]) => Promise<any> | any): this;
    /**
     * Adds a handler for a given interaction ID
     */
    addInteraction<K extends keyof NoAutoComplete | undefined, G extends opBool, D extends opBool>(info: AugurInteractionInfo<K, G, D>): this;
    /**
     * Used to share common functions or variables between modules without using hacky `module.exports` methods
     */
    setShared(toShare: any): this;
    /**
     * Runs a function on an interval. The client object is provided to the function.
     */
    setClockwork(clockwork: Clockwork | undefined): this;
    /**
     * A function to be run when the module is reloaded.
     *
     * If the module was reloaded, the results of `setUnload` will be passed in as an argument.
     */
    setInit(init: InitFunction): this;
    /**
     * Upon a module unload, the function will be run. The return value will be sent to `setInit` if the module is reloaded.
     */
    setUnload(unload: UnloadFunction): this;
}
