"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
/** DEFAULT FUNCTIONS*/
const DEFAULTS = {
    errorHandler: (error, message) => {
        console.error(Date());
        if (message instanceof discord_js_1.default.Message) {
            console.error(`${message.author.username} in ${(message.guild ? (`${message.guild.name} > ${message.channel.name}`) : "DM")}: ${message.cleanContent}`);
        }
        else if (message) {
            console.error(message);
        }
        console.error(error);
    },
    parse: (message) => __awaiter(void 0, void 0, void 0, function* () {
        let content = message.content;
        let setPrefix = message.client.config.prefix || "!";
        if (message.author.bot)
            return null;
        for (let prefix of [setPrefix, `<@${message.client.user.id}>`, `<@!${message.client.user.id}>`]) {
            if (!content.startsWith(prefix))
                continue;
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
    }),
    commandExecution: (cmd, message, args) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            let reply = "";
            /**Enabled*/ if (!cmd.enabled)
                return;
            /**Only Owner*/ else if (cmd.onlyOwner && message.author.id != message.client.config.ownerId)
                return;
            /**Only Guild*/ else if (cmd.onlyGuild && !message.guild)
                reply = `That command can only be used in a server.`;
            /**Only DM*/ else if (cmd.onlyDm && message.guild)
                reply = `That command can only be used in a DM`;
            /**userPermissions*/ else if (((_a = cmd.userPermissions) === null || _a === void 0 ? void 0 : _a.length) > 0 && (message.guild ? !((_b = message.member) === null || _b === void 0 ? void 0 : _b.permissions.has(cmd.userPermissions, true)) : true))
                reply = `You don't have permission to use that command!`;
            /**permissions*/ else if (!(yield cmd.permissions(message)))
                reply = `You don't have permission to use that command!`;
            if (reply)
                return message.reply(reply).then(DEFAULTS.clean);
            else
                return yield cmd.process(message, ...args);
        }
        catch (error) {
            if (cmd.client)
                cmd.client.errorHandler(error, message);
            else
                console.error(error);
        }
    }),
    interactionExecution: (cmd, interaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            let reply = "";
            /**Enabled*/ if (!cmd.enabled)
                return;
            /**Only Owner*/ else if (cmd.onlyOwner && ((_a = interaction.member) === null || _a === void 0 ? void 0 : _a.user.id) != cmd.client.config.ownerId)
                return;
            /**Only Guild*/ else if (cmd.onlyGuild && !interaction.guild)
                reply = `That command can only be used in a server.`;
            /**Only Specific Guild*/ else if (cmd.guildId && ((_b = interaction.guild) === null || _b === void 0 ? void 0 : _b.id) != cmd.guildId)
                reply = `That command can only be used in a specific server.`;
            /**Only DM*/ else if (cmd.onlyDm && interaction.guild)
                reply = `That command can only be used in a DM`;
            /**userPermissions*/ else if (cmd.userPermissions.length > 0 && (interaction.inGuild() ? !interaction.member.permissions.has(cmd.userPermissions) : true))
                reply = `You don't have permission to use that command!`;
            /**permissions*/ else if (!(yield cmd.permissions(interaction)))
                reply = `You don't have permission to use that command!`;
            if (interaction.isAutocomplete()) {
                if (reply)
                    return;
                else
                    return yield cmd.autocomplete(interaction);
            }
            else {
                if (reply) {
                    if (!interaction.replied && !interaction.deferred)
                        interaction.reply({ content: reply, ephemeral: true });
                    else
                        interaction.editReply({ content: reply });
                }
                else
                    return yield cmd.process(interaction);
            }
        }
        catch (error) {
            if (cmd.client)
                cmd.client.errorHandler(error, interaction);
            else
                console.error(error);
        }
    }),
    clean: (message) => __awaiter(void 0, void 0, void 0, function* () {
        setTimeout(() => {
            try {
                if (message.deletable)
                    message.delete();
            }
            catch (error) {
                return;
            }
        }, 20000);
    }),
    delayStart: () => __awaiter(void 0, void 0, void 0, function* () {
        return;
    })
};
exports.default = DEFAULTS;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3RydWN0dXJlcy9kZWZhdWx0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLDREQUFnQztBQUdoQyx1QkFBdUI7QUFDdkIsTUFBTSxRQUFRLEdBQUc7SUFDYixZQUFZLEVBQUUsQ0FBQyxLQUFxQixFQUFFLE9BQWEsRUFBRSxFQUFFO1FBQ25ELE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN0QixJQUFJLE9BQU8sWUFBWSxvQkFBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTyxPQUFPLENBQUMsT0FBZ0MsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUN0TCxDQUFDO2FBQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNqQixPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNCLENBQUM7UUFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxLQUFLLEVBQUUsQ0FBTyxPQUF3QixFQUFFLEVBQUU7UUFDdEMsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUM5QixJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFBO1FBQ25ELElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFDcEMs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