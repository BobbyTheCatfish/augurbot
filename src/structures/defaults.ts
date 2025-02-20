import Discord from "discord.js"
import { AugurCommand } from "./AugurCommand";
import { AugurInteraction } from "./AugurInteraction";
/** DEFAULT FUNCTIONS*/
const DEFAULTS = {
    errorHandler: (error: Error | string, message?: any) => {
        console.error(Date());
        if (message instanceof Discord.Message) {
            console.error(`${message.author.username} in ${(message.guild ? (`${message.guild.name} > ${(message.channel as Discord.GuildChannel).name}`) : "DM")}: ${message.cleanContent}`);
        } else if (message) {
            console.error(message);
        }
        console.error(error);
    },

    parse: async (message: Discord.Message) => {
        let content = message.content;
        let setPrefix = message.client.config.prefix || "!"
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
    },

    commandExecution: async (cmd: AugurCommand, message: Discord.Message, args: string[]) => {
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

    interactionExecution: async (cmd: AugurInteraction, interaction: Discord.Interaction) => {
        try {
            let reply = ""
            /**Enabled*/ if (!cmd.enabled) return
            /**Only Owner*/ else if (cmd.onlyOwner && interaction.member?.user.id != cmd.client.config.ownerId) return;
            /**Only Guild*/ else if (cmd.onlyGuild && !interaction.guild) reply = `That command can only be used in a server.`
            /**Only Specific Guild*/ else if (cmd.guildId && interaction.guild?.id != cmd.guildId) reply = `That command can only be used in a specific server.`
            /**Only DM*/ else if (cmd.onlyDm && interaction.guild) reply = `That command can only be used in a DM`
            /**userPermissions*/ else if (cmd.userPermissions.length > 0 && (interaction.inGuild() ? !(interaction.member.permissions as Discord.PermissionsBitField).has(cmd.userPermissions) : true)) reply = `You don't have permission to use that command!`
            /**permissions*/ else if (!await cmd.permissions(interaction)) reply = `You don't have permission to use that command!`
            if (interaction.isAutocomplete()) {
                if (reply) return;
                else return await cmd.autocomplete(interaction)
            } else {
                if (reply) {
                    if (!interaction.replied && !interaction.deferred) interaction.reply({content: reply, ephemeral: true})
                    else interaction.editReply({content: reply})
                }
                else return await cmd.process(interaction)
            }
        } catch (error: any) {
            if (cmd.client) cmd.client.errorHandler(error, interaction);
            else console.error(error);
        }
    },
    
    clean: async (message: Discord.Message) => {
        setTimeout(() => {
            try {
                if (message.deletable) message.delete()
            } catch (error) {
                return;
            }
        }, 20000)
    },

    delayStart: async () => {
        return;
    }
};

export default DEFAULTS