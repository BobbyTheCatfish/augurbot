
<h1  align=center> Augur-TS - Discord bot framework</h1>

  

<h4 align=center> Augur-TS is a <a href="https://github.com/gaiwecoor/augurbot">fork</a> of a Discord bot framework, utilizing the <a href="https://old.discordjs.dev/#/docs">discord.js</a> library.</h4>


<p  align=center>
<!--License</!-->
<img src=https://img.shields.io/npm/l/augurbot-ts>
<!--Version</!-->
<img src=https://img.shields.io/npm/v/augurbot-ts>
<!--Github</!-->
<img src=https://img.shields.io/github/package-json/v/Bobbythecatfish/augurbot/master>
<!--Downloads</!-->
<img src=https://img.shields.io/npm/dm/augurbot-ts>
<!--Discord</!-->
<img src=https://img.shields.io/discord/406821751905976320>
</p>


### Installation

`npm install --save augurbot-ts discord.js`  



<details>
<summary><h2>Change Log</h2></summary>
As of version 3.0.0, Augur uses Discord.js v14.13 and requires Node 16+.

  

3.0.0 updated to D.JS v14 and changed quite a few things

* The project now uses Typescript (can be used with `require()` or `import`)

* All classes, variables, and functions now have correct typings, including the following

    *  `Module.addCommand()`

    *  `Module.addInteraction()`

    *  `Module.addEvent()`, including event names and handler parameters

    *  `Module.setClockwork()`

    *  `AugurClient` config and options

  

* Discord.JS's `client` class has been extended to include `AugurClient`'s properties

* Removed legacy `DiscordInteraction` and `DiscordInteractionResponse` from 2.3.0

* Added the following as additional verifications for commands and interaction commands

    *  `userPermissions`: `Discord.PermissionResolvable[]`

    *  `onlyOwner`: `boolean (false)`

    *  `onlyGuild`: `boolean (false)`

    *  `onlyDm`: `boolean (false)`

* Added `commandExecution` and `interactionExecution` to `AugurClient`'s options as a way to customize the way message and interaction commands are handled

* Exported additional helpers such as `CommandManager`, `ClockworkManager`, `EventManager`, `InteractionManager`, and `ModuleManager`
  

2.3.0 introduced several new features

  

2.0.1 automatically unloads all modules prior to executing `client.destroy()`.

  

2.0.8 includes various bugfixes.

</details>  
  


<details open>
<summary><h2>Getting Started - The Augur Client</h2></summary>

## Augur Client
  

Within your base file, require `augurbot-ts` and create a new instance of `AugurClient`:

```js

const { AugurClient } = require("augurbot-ts");

const  client = new AugurClient(config, options?);

client.login();

```


The AugurClient will create the Discord Client, log it in using the token provided in `config.token`, listen for events, and process commands. Any gateway intents are automatically calculated based on `config.events`.

<br>

### AugurClient Config

| PROPERTY | TYPE | REQUIRED | DEFAULT | DESCRIPTION |
|:---:|:---:|:---:|:---:|---|
| events | [Discord.ClientEvents](https://old.discordjs.dev/#/docs/discord.js/main/typedef/Events)[] | ✓ |  | An array of discord.js events to process, including `messageCreate` and `messageUpdate`, if your bot will be processing message commands. Gateway intents will be automatically calculated based on the `events` supplied. |
| ownerId | [Snowflake](https://old.discordjs.dev/#/docs/discord.js/main/typedef/Snowflake) |  |  | The ID of the bot owner, used in the `onlyOwner` property in the command structure |
| db | object |  |  | An object, including a `model` property which is the path to your database model, relative to the base file. |
| prefix | string |  | ! | A default prefix for commands |
| processDMs | boolean |  | true | Whether to process messages in DMs |
| token | string |  |  | Your bot's Discord token to log in. If provided in the `config` object, it does not need to be passed to `client.login()`. If omitted, it *must* be passed to `client.login()`. |
| utils | any |  |  | A set of utilities you would like to access anywhere |
| ... | any |  |  | Any other properties you wish to be able to access from your command modules may be added |



---

### AugurClient Options (optional)

| PROPERTY | TYPE | DESCRIPTION |
|:---:|:---:|---|
| clientOptions | [Discord.ClientOptions](https://old.discordjs.dev/#/docs/discord.js/main/typedef/ClientOptions) | An object containing options to be passed to the new [Discord.Client](https://old.discordjs.dev/#/docs/discord.js/main/class/Client). Gateway intents are automatically calulated based on `config.events`. If you would like to override the calculated intents, provide your own intents as usual for Discord.js |
| commands | `string` | A directory, relative to the base file, containing any command modules you wish to automatically load. |
| errorHandler | Function (Error \| string, [Discord.Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message) \| [Discord.BaseInteraction](https://old.discordjs.dev/#/docs/discord.js/main/class/BaseInteraction) \| string) => void | A function accepting an `Error` and one of [Discord.Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message), [Discord.BaseInteraction](https://old.discordjs.dev/#/docs/discord.js/main/class/BaseInteraction), or `string` as its arguments. This will replace the default error handling function. |
| parse | Function ([Discord.Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message)) => Promise\<{command: string, suffix: string, params: string[]}> | An asynchronous function accepting a [Discord.Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message) as its argument, returning an object with `command`, `suffix`, and `params` properties. This will replace the default parsing function. (Useful in case different servers use different prefixes, for example. Awaited in the case of a database call) |
| commandExecution | Function ([AugurCommand](#commands), [Discord.Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message), string[]) => Promise<[AugurCommand](#commands).process() \| void> | An asynchronous function accepting an `AugurCommand`, `Discord.Message`, and `string[]` (or whatever `parse` is set to export as `params`). This replaces the default execution function and should call `command.process(message, ...params)` |
| interactionExecution | Function ([AugurInteractionCommand](#interaction-commands), [Discord.BaseInteraction](https://old.discordjs.dev/#/docs/discord.js/main/class/BaseInteraction)) => Promise<[AugurInteractionCommand](#interaction-commands).process() \| void> | An asynchronous function accepting an `AugurInteractionCommand` and a `Discord.Interaction`. This replaces the default execution function and should call `command.process(interaction)` |

<details>
<summary><h4>Default Client Option Functions (errorHandler, parse, etc)</h4></summary>

The following are the default functions for the AugurClient options above.

```js
errorHandler: (error, message) => {
    console.error(Date());
    if (message instanceof Discord.Message) {
        const location = `${(message.guild ? (`${message.guild.name} > ${(message.channel).name}`) : "DM")}`
        console.error(`${message.author.username} in ${location}: ${message.cleanContent}`);
    } else if (message) {
        console.error(message);
    }
    console.error(error);
}
```

```js
    parse: async (message) => {
        let content = message.content;
        let setPrefix = message.client.prefix || "!"
        if (message.author.bot) return null;
        for (let prefix of [setPrefix, `<@${message.client.user.id}>`, `<@!${message.client.user.id}>`]) {
            if (!content.startsWith(prefix)) continue;
            let [command, ...params] = content.substring(prefix.length).split(" ");
            if (command) {
                return {
                    command: command.toLowerCase(),
                    suffix: params.join(" "),
                    params
                };
            }
        }
        return null;
    }
```


```js
commandExecution: async (cmd, message, args) => {
    try {
        
        let reply = ""
        /**Enabled*/ if (!cmd.enabled) return
        /**Only Owner*/ else if (cmd.onlyOwner && message.author.id != message.client.config.ownerId) return;
        /**Only Guild*/ else if (cmd.onlyGuild && !message.guild) reply = `That command can only be used in a server.`
        /**Only DM*/ else if (cmd.onlyDm && message.guild) reply = `That command can only be used in a DM`
        /**userPermissions*/ else if (cmd.userPermissions?.length > 0 && (message.guild ? !message.member?.permissions.has(cmd.userPermissions, true) : true)) reply = `You don't have permission to use that command!`
        /**permissions*/ else if (!await cmd.permissions(message)) reply = `You don't have permission to use that command!`
        if (reply) return message.reply(reply).then(DEFAULTS.clean)
        else return await cmd.process(message, ...args);

    } catch (error: any) {
        if (cmd.client) cmd.client.errorHandler(error, message);
        else console.error(error);
    }
},
```


```js
interactionExecution: async (cmd: AugurInteractionCommand, interaction: Discord.BaseInteraction) => {
    try {
        let reply = ""
        /**Enabled*/ if (!cmd.enabled) return
        /**Only Owner*/ else if (cmd.onlyOwner && interaction.member?.user.id != cmd.client.config.ownerId) return;
        /**Only Guild*/ else if (cmd.onlyGuild && !interaction.guild) reply = `That command can only be used in a server.`
        /**Only DM*/ else if (cmd.onlyDm && interaction.guild) reply = `That command can only be used in a DM`
        /**userPermissions*/ else if (cmd.userPermissions.length > 0 && (interaction.guild ? !(interaction.member?.permissions).has(cmd.userPermissions) : true)) reply = `You don't have permission to use that command!`
        /**permissions*/ else if (!await cmd.validation(interaction)) reply = `You don't have permission to use that command!`
        
        if (reply && interaction.isRepliable()) {
            if (!interaction.replied) interaction.reply({content: reply, ephemeral: true})
            else interaction.editReply({content: reply})
        }
        else return await cmd.process(interaction)
    } catch (error: any) {
        if (cmd.client) cmd.client.errorHandler(error, interaction);
        else console.error(error);
    }
}
```
</details>

### AugurClient Properties
Properties of the AugurClient class:
* [config](#augurclient-config): The `config` object passed to the `AugurClient`.
* [augurOptions](#augurclient-options-optional): The options object passed to the `AugurClient` upon initialization.
* `db`: Your loaded database model.
* [clockwork](#clockwork-manager): A collection of functions to be run by an interval.
* [commands](#command-manager): A collection of commands, keyed by command name
* [events](#event-manager): A collection of event handlers, keyed by event then keyed by filepath.
* [interactions](#interaction-manager): A collection of interaction event handlers for slash commands, keyed by interaction id.
* [moduleHandler](#module-manager): Helper methods for loading/unloading/reloading Augur AugurModules.

### AugurClient Methods

Methods of the AugurClient class:

* [errorHandler](#augurclient-options-optional): Error handling function.
* [parse](#augurclient-options-optional): Parse a message into its command name and suffix. Returns an object containing `command` (`string`), `suffix` (`string`), and `params` (`string[]`)
* [commandExecution](#augurclient-options-optional): Handles command execution
* [interactionExecution](#augurclient-options-optional): Handles interaction execution

</details>

---
  
<details open>
<summary><h2>Create Commands & Events - Module File Structure</h2></summary>

The basic file structure should look something like this

- index.js
- config.json (contains your [AugurClient Config](#augurclient-config))
- ./modules (Also commonly called commands. The name doesn't matter, just make sure it's the same as the `commands` property in your [AugurClient Options](#augurclient-options-optional))
- - *.js (these are your AugurModule files)


The basic file structure for AugurModule files:

```js

const  Augur = require("augurbot");

const  Module = new Augur.Module();


// Add commands, interactions, event handlers, etc. as necessary.

//Ex: Module.addCommand({...}).addCommand({...}).addEvent(...);


module.exports = Module;

```

  

In between, you can add one or more commands and event handlers, as well as a clockwork and unload function.

  

`Module` properties include:

  

*  [config](#augurclient-config): Contents of the config object loaded with the AugurClient.

  

*  `db`: The loaded database model.

  

*  [client](#augur-client): The Augur client which loaded the command module.

  

*  [commands](#command-manager): The commands in the module

  

*  [interactions](#interaction-manager): The interaction commands in the module

  

*  [clockwork](#clockwork): The clockwork set in the module

  

*  [init](#initialization) and [unload](#unloading): The initialized and unloaded data

  
  

All of the following methods are chainable:

### Clockwork

The function passed to the `.setClockwork()` method should return an interval which will continue to run in the background. The interval is cleared and reloaded when the module is reloaded. Note that the clockwork function is run *after* the intialization function.

```js

Module.setClockwork(function() {
    return  setInterval();
});

```

### Commands

The `.addCommand()` method defines a new bot command.

```js

Module.addCommand({AugurCommandInfo});

```

| PROPERTY | TYPE | REQUIRED | DEFAULT | DESCRIPTION |
|:---:|:---:|:---:|:---:|---|
| name | string | ✓ |  | A string for the name of the command |
| process | Function ([Discord.Message]((https://old.discordjs.dev/#/docs/discord.js/main/class/Message)), ...string[]) => void | ✓ |  | The function to run when the command is invoked. |
| aliases | string[] |  |  | An array of strings that can be used as alternates to the command name |
| syntax | string |  |  | A description of command syntax |
| description | string |  |  | A short overview of the command |
| info | string |  |  | A longer description of the command's usage |
| category | string |  | { The AugurModule filename } | The name of the category the command belongs in. Helpful for sorting/categorizing. |
| permissions | Function ([Discord.Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message)) => boolean |  |  | Used to validate if the command should be run based off of the message or user that triggered the command |
| userPermissions | [Discord.PermissionResolveable](https://old.discordjs.dev/#/docs/discord.js/main/typedef/PermissionResolvable)[] |  |  | Used to check if the member using the command has the right server permissions |
| options | Object |  |  | An object of custom options that the developer may wish to use (e.g. in parsing messages) |
| hidden | boolean |  | false | A helper for hiding commands in your help functions |
| enabled | boolean |  | true | If set to false, the command will never run |
| parseParams | boolean |  | false | If set to true, the command suffix will be split by " " before passing the parameters to the `process` function |
| onlyOwner | boolean |  | false | If set to true, only the user with the ID provided under `ownerId` in [AugurClient Config](#augurclient-config) will be able to run the command |
| onlyGuild | boolean |  | false | If set to true, the command will only be run if called in a server |
| onlyDm | boolean |  | false | If set to true, the command will only be run if called in a DM with the bot |

### Events

The `.addEvent()` method adds an event handler for the various Discord.js events.

```js

Module.addEvent("eventName", function(...args) {});

```
  
### Interaction Commands

You can use the functions provided in [InteractionManager](#interaction-manager) to register interaction commands. This section is for handling those interactions.

The `.addInteraction()` method defines an interaction for slash commands.

```js

Module.addInteraction({AugurInteractionCommandInfo});

```

| PROPERTY | TYPE | REQUIRED | DEFAULT | DESCRIPTION |
|:---:|:---:|:---:|:---:|---|
| id | string | ✓ |  | The interaction ID for the interaction command |
| process | Function ([Discord.BaseInteraction](https://old.discordjs.dev/#/docs/discord.js/main/class/BaseInteraction)) => void | ✓ |  | The function to run when the command is invoked. |
| name | string |  |  | The name of the command |
| syntax | string |  |  | A description of command syntax |
| description | string |  |  | A short overview of the command |
| info | string |  |  | A longer description of the command's usage |
| category | string |  | { The AugurModule filename } | The name of the category the command belongs in. Helpful for sorting/categorizing. |
| permissions | Function ([Discord.BaseInteraction](https://old.discordjs.dev/#/docs/discord.js/main/class/BaseInteraction)) => Boolean |  |  | Used to validate if the command should be run based off of the message or user that triggered the command |
| userPermissions | [Discord.PermissionResolveable](https://old.discordjs.dev/#/docs/discord.js/main/typedef/PermissionResolvable)[] |  |  | Used to check if the member using the command has the right server permissions |
| options | Object |  |  | An object of custom options that the developer may wish to use (e.g. in parsing messages) |
| hidden | boolean |  | false | A helper for hiding commands in your help functions |
| enabled | boolean |  | true | If set to false, the command will never run |
| parseParams | boolean |  | false | If set to true, the command suffix will be split by " " before passing the parameters to the `process` function |
| onlyOwner | boolean |  | false | If set to true, only the user with the ID provided under `ownerId` in [AugurClient Config](#augurclient-config) will be able to run the command |
| onlyGuild | boolean |  | false | If set to true, the command will only be run if called in a server |
| onlyDm | boolean |  | false | If set to true, the command will only be run if called in a DM with the bot |

### Initialization

The `.setInit(data)` method accepts a function to run on module initialization. The `data` parameter will have a `null` value on the first run, and will contain the returned by the function defined with the `.setUnload()` method on subsequent reloads of the module.

```js

Module.setInit(function(data) {});

```

  

### Unloading

The function passed to the `.setUnload()` method will be run when unloading or reloading the module.

```js

Module.setUnload(function() {});

```
</details>

<details open>
<summary><h3>Managers</h3></summary>

##### Clockwork Manager

*  `register(AugurModule)`: Registers clockwork functions from a Module. Automatically called by `client.moduleHandler.register(AugurModule)`.

*  `unload(filepath)`: Unload a clockwork function from memory. Automatically called by `client.moduleHandler.unload(filepath)`.

##### Module Manager

*  `register(AugurModule, data)`: Register the module with optional data.

*  `reload(filepath)`: Reload a module from a filepath, reregistering the module with data supplied by the command's `.unload()` method.

*  `unload(filepath)`: Unload a module from memory.

##### Command Manager

*  `aliases` (Collection): Collection of commands, keyed by alias.

*  `client` (AugurClient): The client.

*  `commandCount` (Number): Integer of how many commands have been executed via `commands.execute()`.

*  `execute(commandName, message, suffix)` (async function): Execute a command function. Automatically called by the event handler.

*  `register(AugurModule)` (function): Registers commands from a Module. Automatically called by `client.moduleHandler.register(AugurModule)`.

##### Event Manager

*  `register(AugurModule)`: Registers event handlers from a Module. Automatically called by `client.moduleHandler.register(AugurModule)`.  

##### Interaction Manager

*  `register(AugurModule)` (function): Registers interaction commands from a Module. Automatically called by `client.moduleHandler.register(AugurModule)`.

*  `createGlobalCommand(data)` (function): Registers a new global slash command with Discord.

*  `createGuildCommand(guildId, data)` (function): Registers a new guild slash command with Discord.

*  `deleteGlobalCommand(commandId)` (function): Deletes an existing global slash command with Discord.

*  `deleteGuildCommand(guildId, commandId)` (function): Deletes an existing guild slash command with Discord.

*  `editGlobalCommand(commandId, data)` (function): Edits an existing global slash command with Discord.

*  `editGuildCommand(guildId, commandId, data)` (function): Edits an existing guild slash command with Discord.

*  `getGlobalCommands(commandId)` (function): Fetches an array of all global slash commands (when no `commandId` provided) or a single global slash command (when `commandId` provided).

*  `getGuildCommands(guildId, commandId)` (function): Fetches an array of all guild slash commands (when no `commandId` provided) or a single guild slash command (when `commandId` provided).
</summary>
