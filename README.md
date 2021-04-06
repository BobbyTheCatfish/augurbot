## Augur - Discord bot framework

Augur is a Discord bot framework, utilizing the `discord.js` library.

### Change Log

As of version 2.3.0, Augur uses Discord.js v12.2 and requires Node 14+.

2.3.0 introduces several new features:
* AugurCommand.parseParams
* AugurCommand.options
* AugurInteractionCommand
* AugurModule.addInteraction()
* DiscordInteraction
* DiscordInteractionResponse
* ModuleManager.InteractionManager

2.0.1 automatically unloads all modules prior to executing `client.destroy()`.

2.0.8 includes various bugfixes.

### Installation

`npm install --save augurbot discord.js`

---

## The Augur Client

Within your base file, require `augurbot` and create a new instance of `AugurClient`:
```
const {AugurClient} = require("augurbot");
const client = new AugurClient(config, options);

client.login();
```

The AugurClient will create the Discord Client, log it in using the token provided in `config.token`, listen for events, and process commands. Any gateway intents are automatically calculated based on `config.events`.

### The `config` Object

Minimum required properties in `config` include:

* `events` (array): An array of discord.js events to process, including `message` and `messageUpdate`, if your bot will be processing message commands. Gateway intents will be automatically calculated based on the `events` supplied.

Additional optional properties include:

* `db` (object): An object, including a `model` property which is the path to your database model, relative to the base file.

* `prefix` (string): A default prefix for commands. Defaults to `!`.

* `processDMs` (boolean): Whether to process messages in DMs. Defaults to `true`.

* `token` (string): Your bot's Discord token to log in. If provided in the `config` object, it does not need to be passed when `client.login()` is called. If omitted, it *must* be passed with `client.login(token)` when logging in.

* Any other properties you wish to be able to access from your command modules.

### The `options` Object

The `options` object is optional, but may include:

* `clientOptions` (object): An object containing options to be passed to the new Discord.Client(). Gateway intents are automatically calulated based on `config.events`. If you would like to override the calculated intents, provide your own intents as usual for Discord.js.

* `commands` (string): A directory, relative to the base file, containing any command modules you wish to automatically load.

* `errorHandler`: A function accepting `error` and `message` as its arguments. This will replace the default error handling function.

* `parse` (async function): An asynchronous function accepting `message` as its argument, returning an object with `command` and `suffix` properties. This will replace the default parsing function. (Useful in case different servers use different prefixes, for example.)

### AugurClient Properties

Properties of the AugurClient class:

* `augurOptions` (object): The options object passed to the client upon initialization.

* `clockwork` (ClockworkManager extends Collection):

  A collection of functions to be run by an interval.
  * `register(AugurModule)`: Registers clockwork functions from a Module. Automatically called by `client.moduleHandler.register(AugurModule)`.
  * `unload(filepath)`: Unload a clockwork function from memory. Automatically called by `client.moduleHandler.unload(filepath)`.

* `commands` (CommandManager extends Collection):

  A collection of commands, keyed by command name.
  * `aliases` (Collection): Collection of commands, keyed by alias.
  * `client` (AugurClient): The client.
  * `commandCount` (Number): Integer of how many commands have been executed via `commands.execute()`.
  * `execute(commandName, message, suffix)` (async function): Execute a command function. Automatically called by the event handler.
  * `register(AugurModule)` (function): Registers commands from a Module. Automatically called by `client.moduleHandler.register(AugurModule)`.

* `config`: The `config` object passed to the AugurClient.

* `db`: Your loaded database model.

* `events` (EventManager extends Collection):

  A collection of event handlers, keyed by event then keyed by filepath.
  * `register(AugurModule)`: Registers event handlers from a Module. Automatically called by `client.moduleHandler.register(AugurModule)`.

* `interactions` (InteractionManager extends Collection):

  A collection of interaction event handlers for slash commands, keyed by interaction id.
  **NOTE:** As of Augur 2.3.0, Augur does *not* handle creating the data object to create or edit an interaction. See the [Discord Developer Portal](https://discord.com/developers/docs/interactions/slash-commands#registering-a-command) for details on the data object required to register a command.
  * `register(AugurModule)` (function): Registers interaction commands from a Module. Automatically called by `client.moduleHandler.register(AugurModule)`.
  * `createGlobalCommand(data)` (function): Registers a new global slash command with Discord.
  * `createGuildCommand(guildId, data)` (function): Registers a new guild slash command with Discord.
  * `deleteGlobalCommand(commandId)` (function): Deletes an existing global slash command with Discord.
  * `deleteGuildCommand(guildId, commandId)` (function): Deletes an existing guild slash command with Discord.
  * `editGlobalCommand(commandId, data)` (function): Edits an existing global slash command with Discord.
  * `editGuildCommand(guildId, commandId, data)` (function): Edits an existing guild slash command with Discord.
  * `getGlobalCommands(commandId)` (function): Fetches an array of all global slash commands (when no `commandId` provided) or a single global slash command (when `commandId` provided).
  * `getGuildCommands(guildId, commandId)` (function): Fetches an array of all guild slash commands (when no `commandId` provided) or a single guild slash command (when `commandId` provided).

* `moduleHandler` (ModuleManager):

  Helper methods for loading/unloading/reloading Augur AugurModules.
  * `register(AugurModule, data)`: Register the module with optional data.
  * `reload(filepath)`: Reload a module from a filepath, reregistering the module with data supplied by the command's `.unload()` method.
  * `unload(filepath)`: Unload a module from memory.

### AugurClient Methods

Methods of the AugurClient class:

* `errorHandler(error, message)`: Error handling function.

* `parse(message)`: Parse a message into its command name and suffix. Returns an object containing `command` (string) and `suffix` (string).

---

## Command File Structure

The basic file structure:
```
const Augur = require("augurbot");
const Module = new Augur.Module();

// Add commands, interactions, event handlers, etc. as necessary.

module.exports = Module;
```

In between, you can add one or more commands and event handlers, as well as a clockwork and unload function.

`Module` properties include:

* `config`: Contents of the config object loaded with the AugurClient.

* `db`: The loaded database model.

* `client`: The Augur client which loaded the command module.

All of the following methods are chainable:

### Clockwork
The function passed to the `.setClockwork()` method should return an interval which will continue to run in the background. The interval is cleared and reloaded when the module is reloaded. Note that the clockwork function is run *after* the intialization function.
```
Module.setClockwork(function() {
  return setInterval();
});
```

### Commands
The `.addCommand()` method defines a new bot command.
```
Module.addCommand({
  name: "commandname",
  aliases: [],
  syntax: "",
  description: "",
  info: "",
  hidden: false,
  category: "",
  enabled: true,
  otherPerms: async (msg) => {},
  permissions: [],
  parseParams: false,
  options: {},
  ownerOnly: false,
  guildOnly: false,
  dmOnly: false,
  process: async (msg, suffix) => {}
});
```
* `name` (string): Required. A string for the name of the command.
* `aliases` (array of strings): An array of strings that can can be used as alternate names for the command.
* `syntax` (string): A string describing command syntax.
* `description` (string): A short string for a brief overview of the command.
* `info` (string): A longer string with more details about the command's usage.
* `hidden` (boolean): A boolean for whether you want to hide the command in your help functions. Defaults to `false`.
* `category` (string): A category name, for convenience in organizing commands. Defaults to the filename of the module.
* `enabled` (boolean): Whether the command is able to run. Defaults to `true`.
* `otherPerms` (function): A function used to determine whether the user has permission to run the command. Accepts a `Discord.Message` object.
* `permissions` (array of PermissionResolvables): An array that is used to check for a guild member's permissions
* `parseParams` (boolean): Determines whether to split the command suffix before passing the parameters to the `process` function. Defaults to `false`.
* `options` (object): An object of custom options that the developer may wish to use (e.g. in parsing messages).
* `ownerOnly` (boolean): Whether or not the bot owner is the only user allowed to run the command. Defaults to `false`.
* `guildOnly` (boolean): Determines if the command should only run when used in a guild or not. Defaults to `false`.
* `dmOnly` (boolean): Determines if the command should only run when used in a DM or not. Defaults to `false`.
* `process` (function): Required. The function to run when the command is invoked. This accepts either:
  * If `parseParams` is `false`, (message, suffix); a `Discord.Message` object and a `suffix` string of the remainder of the command supplied by the user; or
  * If `parseParams` is `true`, (message, ...params); a `Discord.Message` object and a list of parameters suppried by the user.

### Events
The `.addEvent()` method adds an event handler for the various Discord.js events.
```
Module.addEvent("eventName", function(...args) {});
```

### Interactions
The `.addInteraction()` method defines an interaction for slash commands.
```
Module.addInteraction({
  id: "interactionId",
  name: "commandname",
  syntax: "",
  description: "",
  info: "",
  hidden: false,
  category: "",
  enabled: true,
  otherPerms: async (msg) => {},
  permissions: [],
  options: {},
  ownerOnly: false,
  guildOnly: false,
  dmOnly: false,
  process: async (interaction) => {}
});
```
* `id` (string): Required. The interaction ID for the slash command.
* `name`  (string): The name of the slash command.
* `syntax` (string): A string describing command syntax.
* `description` (string): A short string for a brief overview of the slash command.
* `info` (string): A longer string with more details about the slash command's usage.
* `hidden` (boolean): A boolean for whether you want to hide the slash command in your help functions. Defaults to `false`.
* `category` (string): A category name, for convenience in organizing slash commands. Defaults to the filename of the module.
* `enabled` (boolean): Whether the slash command is able to run. Defaults to `true`.
* `otherPerms` (function): A function used to determine whether the user has permission to run the slash command. Accepts a `DiscordInteraction` object.
* `permissions` (array of PermissionResolvables): An array that is used to check for a guild member's permissions
* `options` (object): An object of custom options that the developer may wish to use (e.g. in parsing messages).
* `ownerOnly` (boolean): Whether or not the bot owner is the only user allowed to run the slash command. Defaults to `false`.
* `guildOnly` (boolean): Determines if the slash command should only run when used in a guild or not. Defaults to `false`.
* `dmOnly` (boolean): Determines if the slash command should only run when used in a DM or not. Defaults to `false`.
* `process` (function): Required. The function to run when the slash command is invoked. This accepts a DiscordInteraction object.

### Initialization
The `.setInit(data)` method accepts a function to run on module initialization. The `data` parameter will have a `null` value on the first run, and will contain the returned by the function defined with the `.setUnload()` method on subsequent reloads of the module.
```
Module.setInit(function(data) {});
```

### Unloading
The function passed to the `.setUnload()` method will be run when unloading or reloading the module.
```
Module.setUnload(function() {});
```

## Supplemental Classes
As of Augur 2.3.0, Discord.js does not yet support interactions (slash commands). Once Discord.js supports interactions, the following will likely be removed in favor of official library support. As a temporary fix, the following classes are used within Augur to facilitate slash command use:

### DiscordInteraction
A `DiscordInteraction` represents the data object provided by the Discord API on the `interactionCreate` event. See the [Discord Developer Portal](https://discord.com/developers/docs/interactions/slash-commands#interaction) for additional information. Properties and methods include:
* `client` (AugurClient): The Client that received the interaction.
* `id` (snowflake): id of the interaction
* `type` (InteractionType): the type of the interaction
* `data` (ApplicationCommandInteractionData): the command data payload
* `name` (string): the name of the interaction being used, found in `.data.name`
* `commandId` (snowflake): the id of the interaction being used, found in `.data.id`
* `options` (array): options found in `.data.options`
* `guild` (Discord.Guild): the Guild object representing the Guild where the command was run, if found
* `channel` (Discord.Channel): the Channel object representing the Channel where the command was run, if found
* `member` (Discord.GuildMember): the GuildMember object representing the member running the command, if in a Guild
* `user` (Discord.User): the User object representing the user running the command, if found
* `token` (string): a continuation token for responding to the interaction
* `version` (int) always `1`
* `deferred` (boolean): whether the interaction has been "deferred" and waiting for a full response.

* `defer()`: Defers the interaction response
* `createResponse(content, options)`: Creates an initial response or edits a deferred response.
* `createFollowup(content, options)`: Creates a followup response.
* `deleteResponse(response)`: Deletes the identified interaction response, deleting the original response if no response/id is passed to the method.
* `editResponse(content, options, response)`: Edits the identified interaction response, editing the original response if no response/id is passed to the method.

### DiscordInteractionResponse extends Discord.Message
* `interaction` (DiscordInteraction): The interaction to which the response is related.
* `followup(content, options)`: Convenience method calling `DiscordInteraction.createFollowup(content, options)`.
