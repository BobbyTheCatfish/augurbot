

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

Processing Order:
<br>

0) Bot is logged in and ready, but `ready` event handlers are not triggered yet
1) The application ID is fetched
2) AugurOptions.delayStart is called
3) Modules are loaded (init > clockwork > events > commands > interactions > shared)
4) Augur is ready and triggers any `ready` event handlers
<br>

### AugurClient Config

| PROPERTY | TYPE | REQUIRED | DEFAULT | DESCRIPTION |
|:---:|:---:|:---:|:---:|---|
| events | [ClientEvents](https://old.discordjs.dev/#/docs/discord.js/main/typedef/Events)[] | ✓ |  | An array of discord.js events to process, including `messageCreate` and `messageUpdate`, if your bot will be processing message commands. Gateway intents will be automatically calculated based on the `events` supplied. `messageEdit` has been created as an alternative to `messageUpdate` to address the problem of CDN link and pin updates. |
| ownerId | [Snowflake](https://old.discordjs.dev/#/docs/discord.js/main/typedef/Snowflake) | ✓ |  | The ID of the bot owner, used in the `onlyOwner` property in the command structure |
| prefix | string |  | ! | A default prefix for commands |
| processDMs | boolean |  | true | Whether to process messages in DMs |
| getMessageContent | boolean |  | false | Whether to use the [message content privileged intent](https://discord.com/developers/docs/events/gateway#privileged-intents) |
| token | string |  |  | Your bot's Discord token to log in. If provided in the `config` object, it does not need to be passed to `client.login()`. If omitted, it *must* be passed to `client.login()`. |
| ... | any |  |  | Any other properties you wish to be able to access from your command modules may be added. They will not work with intellisense, so this avoid this if possible. |



---

### AugurClient Options (optional)

| PROPERTY | TYPE | DESCRIPTION |
|:---:|:---:|---|
| clientOptions | [ClientOptions](https://old.discordjs.dev/#/docs/discord.js/main/typedef/ClientOptions) | An object containing options to be passed to the new [Client](https://old.discordjs.dev/#/docs/discord.js/main/class/Client). Gateway intents are automatically calculated based on `config.events`. If you would like to override the calculated intents, provide your own intents as usual for Discord.js |
| modules | `string` | A directory, relative to the base file, containing any command modules you wish to automatically load. |
| errorHandler | Function (Error \| string, [Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message) \| [Interaction](https://old.discordjs.dev/#/docs/discord.js/main/class/BaseInteraction) \| string) => any | A function accepting an `Error` and one of [Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message), [Interaction](https://old.discordjs.dev/#/docs/discord.js/main/class/BaseInteraction), or `string` as its arguments. This will replace the default error handling function. |
| parse | Function ([Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message)) => Promise\<ParsedMessage \| null> | An asynchronous function accepting a [Discord.Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message) as its argument, returning an object with `command`, `suffix`, and `params` properties. This will replace the default parsing function. (Useful in case different servers use different prefixes, for example. Awaited in the case of a database call). The function does *not* have to return a promise if you don't need it to. |
| commandExecution | Function ([AugurCommand](#commands), [Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message), string[]) => Promise<[AugurCommand](#commands).process() \| void> | An asynchronous function accepting an `AugurCommand`, [Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message), and `string[]` (`params`). This replaces the default execution function and should call `command.process(message, ...params)` |
| interactionExecution | Function ([AugurInteraction](#interaction-commands), [Interaction](https://old.discordjs.dev/#/docs/discord.js/main/class/BaseInteraction)) => Promise<[AugurInteraction](#interaction-commands).process() \| void> | An asynchronous function accepting an `AugurInteraction` and an [Interaction](https://old.discordjs.dev/#/docs/discord.js/main/class/BaseInteraction). This replaces the default execution function and should call `command.process(interaction)` |
| delayStart | Function () => Promise\<any> | An asynchronous function that delays module loading and the `ready` event. |

### AugurClient Properties
Properties of the AugurClient class:
* [config](#augurclient-config): The `config` object passed to the `AugurClient`.
* [augurOptions](#augurclient-options-optional): The options object passed to the `AugurClient` upon initialization.
* [applicationId](#augur-client): Your application's ID
* [moduleManager](#module-manager): Holds all of the information for all loaded modules. Includes functions for loading/reloading/unloading modules.

### AugurClient Methods
Methods of the AugurClient class:

* [errorHandler](#augurclient-options-optional): Error handling function.
* [parse](#augurclient-options-optional): Parse a message into its command name and suffix. Returns an object containing `command` (`string`), `suffix` (`string`), and `params` (`string[]`)
* [commandExecution](#augurclient-options-optional): Handles command execution
* [interactionExecution](#augurclient-options-optional): Handles interaction execution
* [delayStart](#augurclient-options-optional): The function that was run when the bot started

* `get<Type>Channel`: This method has been introduced to help with getting the correct type of channel for intellisense. This can replace the traditional `channels.cache.get()` and returns a channel of the correct type. This can also provide actual type safety, as it will return `null` if the channel type is incorrect.


</details>

---
  
<details open>
<summary><h2>Create Commands & Events - Module File Structure</h2></summary>

The basic file structure should look something like this

- 📄 index.js
- 📄 config.json (contains your [AugurClient Config](#augurclient-config))
- 📁./modules (Also commonly called commands. The name doesn't matter, just make sure it's the same as the `modules` property in your [AugurClient Options](#augurclient-options-optional))
    - 📄 *.js (these are your AugurModule files)

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
*  [client](#augur-client): The Augur client which loaded the command module.
*  [commands](#commands): The commands in the module
*  [interactions](#interaction-commands): The interaction commands in the module
*  [clockwork](#clockwork): The clockwork set in the module
*  [init](#initialization) and [unload](#unloading): The initialized and unloaded data
*  [events](#events): A collection of events in the module
*  [shared](#sharing-functionsvariables-between-files): A variable or function to be shared across multiple modules

<br/>
All of the following methods are chainable:

### Clockwork

The function passed to the `.setClockwork()` method should return an interval which will continue to run in the background. The interval is cleared and reloaded when the module is reloaded. Note that the clockwork function is run *after* the initialization function, and after the bot is `ready`.

```js
Module.setClockwork((client) => {
    return setInterval(() => {
        checkXP(client)
    }, 60_000);
});
```

### Commands

The `.addCommand()` method defines a new message based command.

```js
Module.addCommand({
    name: "ping",
    onlyOwner: true,
    process: (msg) => {
        msg.reply("Pong!")
    }
})
// !ping -> Pong!
```

| PROPERTY | TYPE | REQUIRED | DEFAULT | DESCRIPTION |
|:---:|:---:|:---:|:---:|---|
| name | string | ✓ |  | A string for the name of the command |
| process | Function ([Message]((https://old.discordjs.dev/#/docs/discord.js/main/class/Message)), ...string[]) => void | ✓ |  | The function to run when the command is invoked. |
| aliases | string[] |  |  | An array of strings that can be used as alternates to the command name |
| syntax | string |  |  | A description of command syntax |
| description | string |  |  | A short overview of the command |
| info | string |  |  | A longer description of the command's usage |
| category | string |  | { The AugurModule filename } | The name of the category the command belongs in. Helpful for sorting/categorizing in things like help commands. |
| permissions | Function ([Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message)) => boolean |  |  | Used to validate if the command should be run based off of the message that triggered the command |
| userPermissions | [PermissionResolveable](https://old.discordjs.dev/#/docs/discord.js/main/typedef/PermissionResolvable)[] |  |  | Used to check if the member using the command has the right server permissions |
| options | Object |  |  | An object of custom options that the developer may wish to use (e.g. in parsing messages) |
| hidden | boolean |  | false | A helper for hiding commands in your help functions |
| enabled | boolean |  | true | If set to false, the command will never run |
| parseParams | boolean |  | false | If set to true, the command suffix will be split by " " before passing the parameters to the `process` function. |
| onlyOwner | boolean |  | false | If set to true, only the user with the ID provided under `ownerId` in [AugurClient Config](#augurclient-config) will be able to run the command |
| onlyGuild | boolean |  | false | If set to true, the command will only be run if called in a server. This also changes the type of [Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message) to be a guild message.|
| onlyDm | boolean |  | false | If set to true, the command will only be run if called in a DM with the bot. This also changes the type of [Message](https://old.discordjs.dev/#/docs/discord.js/main/class/Message) to be a DM message. |
  
### Interactions

Interaction slash commands and contexts have to be registered with the [Discord API](https://discord.com/developers/docs/interactions/application-commands#registering-a-command) before their first use, or after changes. Augurbot does not handle this. [This](https://github.com/LDS-Gamers-Studios/icarus5.5/blob/main/register-commands.js) is the script that Icarus, the main bot that uses this framework, uses to register it's commands.

The `.addInteraction()` method defines an interaction.

```js
Module.addInteraction({
    id: snowflakes.commands.slashPing,
    name: "ping",
    process: (interaction) => {
        interaction.reply(`${msg.author} you've been pinged!`);
    }
});
// /ping -> @author you've been pinged!
```

| PROPERTY | TYPE | REQUIRED | DEFAULT | DESCRIPTION |
|:---:|:---:|:---:|:---:|---|
| type | string |  |  | Sets the type of interaction the command should expect. Only used for type checking and intellisense, and does not provide any actual safety. |
| id | string | ✓ |  | The interaction ID for the interaction command |
| process | Function ([Interaction](https://old.discordjs.dev/#/docs/discord.js/main/class/ChatInputCommandInteraction)) => void | ✓ |  | The function to run when the command is invoked. The type can change to be more specific, depending on the `type` property.|
| name | string |  |  | The name of the command |
| syntax | string |  |  | A description of command syntax |
| description | string |  |  | A short overview of the command |
| info | string |  |  | A longer description of the command's usage |
| category | string |  | { The AugurModule filename } | The name of the category the command belongs in. Helpful for sorting/categorizing. |
| permissions | Function ([Interaction](https://old.discordjs.dev/#/docs/discord.js/main/class/BaseInteraction)) => Boolean |  |  | Used to validate if the command should be run based off of the message or user that triggered the command. Typing is also changed by the `type` property. |
| userPermissions | [PermissionResolveable](https://old.discordjs.dev/#/docs/discord.js/main/typedef/PermissionResolvable)[] |  |  | Used to check if the member using the command has the right server permissions |
| options | Object |  |  | An object of custom options that the developer may wish to use (e.g. in execution) |
| hidden | boolean |  | false | A helper for hiding commands in your help functions |
| enabled | boolean |  | true | If set to false, the command will never run |
| onlyOwner | boolean |  | false | If set to true, only the user with the ID provided under `ownerId` in [AugurClient Config](#augurclient-config) will be able to run the command |
| onlyGuild | boolean |  | false | If set to true, the command will only be run if called in a server. Sets the type of interaction to be in a guild on top of the provided type. |
| onlyDm | boolean |  | false | If set to true, the command will only be run if called in a DM with the bot |

### Events

The `.addEvent()` method adds an event handler for the various Discord.js events. For convenience, an additional `messageEdit` event has been included that only triggers when message content is edited, rather than any other type of message update.

Keep in mind that there are certain quirks with how events are handled. They are described in the function documentation.
```js
Module.addEvent("messageCreate", (msg) => {
    if (msg.content.toLowerCase().startsWith("i'm")) {
        return msg.reply(`Hi ${msg.author}, I'm AugurBot!`)
    }
});
// I'm bobby -> Hi @Bobby, I'm AugurBot!
```

### Initialization

The `.setInit(data)` method accepts a function to run on module initialization. The `data` parameter will have a `null` value on the first run, and will contain the returned by the function defined with the `.setUnload()` method on subsequent reloads of the module. This function is run after the bot is `ready`.

```js
Module.setInit((data) => {
    if (data) cachedInfo = data;
    else cachedInfo = await fetchInfo();
});
```

  

### Unloading

The function passed to the `.setUnload()` method will be run when unloading or reloading the module.

```js
Module.setUnload(() => {
    return cachedInfo;
});
```

### Sharing Functions/Variables Between Files
```js
// module_1.js

const func = (update) => console.log(update)
const foo = "bar"
Module.setShared({ func, foo });

// module_2.js
Module.addCommand({
    name: "remoteupdate",
    process: (msg) => {
        const shared = msg.client.moduleManager.shared.get("module_1.js")
        shared?.func("Here's your update of the day!")
        console.log(shared?.foo)
    }
})
```
</details>

###### (ps: do `client.debug = true` to get more info when event and command handlers are run)