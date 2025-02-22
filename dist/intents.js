"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Intents = {
    AutoModerationConfiguration: [
        'autoModerationRuleCreate',
        'autoModerationRuleUpdate',
        'autoModerationRuleDelete'
    ],
    AutoModerationExecution: [
        'autoModerationActionExecution'
    ],
    DirectMessageReactions: [
        'messageReactionAdd',
        'messageReactionRemove',
        'messageReactionRemoveAll',
        'messageReactionRemoveEmoji'
    ],
    DirectMessages: [
        'messageCreate',
        'messageUpdate',
        'messageDelete',
        'channelPinsUpdate'
    ],
    DirectMessageTyping: [
        'typingStart'
    ],
    GuildBans: [
        "guildBanAdd",
        "guildBanRemove"
    ],
    Guilds: [
        'guildCreate',
        'guildUpdate',
        'guildDelete',
        'roleCreate',
        'roleUpdate',
        'roleDelete',
        'channelCreate',
        'channelUpdate',
        'channelDelete',
        'channelPinsUpdate',
        'threadCreate',
        'threadUpdate',
        'threadDelete',
        'threadListSync',
        'threadMemberUpdate',
        'threadMembersUpdate', // depends on GUILD_MEMBERS optional intent
        'stageInstanceCreate',
        'stageInstanceUpdate',
        'stageInstanceDelete',
    ],
    GuildMembers: [
        'guildMemberAdd',
        'guildMemberUpdate',
        'guildMemberRemove',
        'guildMembersChunk',
        'threadMembersUpdate' // depends on GUILD_MEMBERS optional intent
    ],
    GuildEmojisAndStickers: [
        "emojiUpdate",
        "stickerUpdate",
        // "soundCreate",
        // "soundUpdate",
        // "soundDelete",
        // "soundsUpdate"
    ],
    GuildIntegrations: [
        "guildIntegrationsUpdate",
        // "integrationCreate",
        // "integrationUpdate",
        // "integrationDelete"
    ],
    GuildInvites: [
        "inviteCreate",
        "inviteDelete"
    ],
    GuildMessageReactions: [
        "messageReactionAdd",
        "messageReactionRemove",
        "messageReactionRemoveAll",
        "messageReactionRemoveEmoji"
    ],
    GuildMessages: [
        "messageCreate",
        "messageUpdate",
        "messageDelete",
        "messageDeleteBulk"
    ],
    GuildMessageTyping: [
        "typingStart"
    ],
    GuildModeration: [
        "guildAuditLogEntryCreate",
        "guildBanAdd",
        "guildBanRemove"
    ],
    GuildPresences: [
        "presenceUpdate"
    ],
    GuildScheduledEvents: [
        "guildScheduledEventCreate",
        "guildScheduledEventUpdate",
        "guildScheduledEventDelete",
        "guildScheduledEventUserRemove",
        "guildScheduledEventUserRemove"
    ],
    GuildVoiceStates: [
        "voiceStateUpdate",
        // @ts-ignore exists in newer versions
        "voiceChannelEffectSend"
    ],
    GuildWebhooks: [
        "webhooksUpdate",
        // "webhookUpdate"
    ],
    GuildMessagePolls: [
        "messagePollVoteAdd",
        "messagePollVoteRemove"
    ],
    DirectMessagePolls: [
        "messagePollVoteAdd",
        "messagePollVoteRemove"
    ]
};
function calcIntent(clientEvents, messageContent = false, dms = true) {
    const intents = new discord_js_1.IntentsBitField();
    const uniqueIntents = new Set(clientEvents);
    const dmIntents = new Set(["DirectMessageReactions", "DirectMessageTyping", "DirectMessages"]);
    for (const intent in Intents) {
        if (dmIntents.has(intent) && !dms)
            continue;
        const events = Intents[intent];
        if (events.find(e => uniqueIntents.has(e)))
            intents.add(intent);
    }
    if (messageContent)
        intents.add("MessageContent");
    return intents.bitfield;
}
exports.default = calcIntent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pbnRlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQWlGO0FBRWpGLE1BQU0sT0FBTyxHQUF5RDtJQUNwRSwyQkFBMkIsRUFBRTtRQUMzQiwwQkFBMEI7UUFDMUIsMEJBQTBCO1FBQzFCLDBCQUEwQjtLQUMzQjtJQUNELHVCQUF1QixFQUFFO1FBQ3ZCLCtCQUErQjtLQUNoQztJQUNELHNCQUFzQixFQUFFO1FBQ3RCLG9CQUFvQjtRQUNwQix1QkFBdUI7UUFDdkIsMEJBQTBCO1FBQzFCLDRCQUE0QjtLQUM3QjtJQUNELGNBQWMsRUFBRTtRQUNkLGVBQWU7UUFDZixlQUFlO1FBQ2YsZUFBZTtRQUNmLG1CQUFtQjtLQUNwQjtJQUNELG1CQUFtQixFQUFFO1FBQ25CLGFBQWE7S0FDZDtJQUNELFNBQVMsRUFBRTtRQUNULGFBQWE7UUFDYixnQkFBZ0I7S0FDakI7SUFDRCxNQUFNLEVBQUU7UUFDTixhQUFhO1FBQ2IsYUFBYTtRQUNiLGFBQWE7UUFDYixZQUFZO1FBQ1osWUFBWTtRQUNaLFlBQVk7UUFDWixlQUFlO1FBQ2YsZUFBZTtRQUNmLGVBQWU7UUFDZixtQkFBbUI7UUFDbkIsY0FBYztRQUNkLGNBQWM7UUFDZCxjQUFjO1FBQ2QsZ0JBQWdCO1FBQ2hCLG9CQUFvQjtRQUNwQixxQkFBcUIsRUFBRSwyQ0FBMkM7UUFDbEUscUJBQXFCO1FBQ3JCLHFCQUFxQjtRQUNyQixxQkFBcUI7S0FDdEI7SUFDRCxZQUFZLEVBQUU7UUFDWixnQkFBZ0I7UUFDaEIsbUJBQW1CO1FBQ25CLG1CQUFtQjtRQUNuQixtQkFBbUI7UUFDbkIscUJBQXFCLENBQUMsMkNBQTJDO0tBQ2xFO0lBQ0Qsc0JBQXNCLEVBQUU7UUFDdEIsYUFBYTtRQUNiLGVBQWU7UUFDZixpQkFBaUI7UUFDakIsaUJBQWlCO1FBQ2pCLGlCQUFpQjtRQUNqQixpQkFBaUI7S0FDbEI7SUFDRCxpQkFBaUIsRUFBRTtRQUNqQix5QkFBeUI7UUFDekIsdUJBQXVCO1FBQ3ZCLHVCQUF1QjtRQUN2QixzQkFBc0I7S0FDdkI7SUFDRCxZQUFZLEVBQUU7UUFDWixjQUFjO1FBQ2QsY0FBYztLQUNmO0lBQ0QscUJBQXFCLEVBQUU7UUFDckIsb0JBQW9CO1FBQ3BCLHVCQUF1QjtRQUN2QiwwQkFBMEI7UUFDMUIsNEJBQTRCO0tBQzdCO0lBQ0QsYUFBYSxFQUFFO1FBQ2IsZUFBZTtRQUNmLGVBQWU7UUFDZixlQUFlO1FBQ2YsbUJBQW1CO0tBQ3BCO0lBQ0Qsa0JBQWtCLEVBQUU7UUFDbEIsYUFBYTtLQUNkO0lBQ0QsZUFBZSxFQUFFO1FBQ2YsMEJBQTBCO1FBQzFCLGFBQWE7UUFDYixnQkFBZ0I7S0FDakI7SUFDRCxjQUFjLEVBQUU7UUFDZCxnQkFBZ0I7S0FDakI7SUFDRCxvQkFBb0IsRUFBRTtRQUNwQiwyQkFBMkI7UUFDM0IsMkJBQTJCO1FBQzNCLDJCQUEyQjtRQUMzQiwrQkFBK0I7UUFDL0IsK0JBQStCO0tBQ2hDO0lBQ0QsZ0JBQWdCLEVBQUU7UUFDaEIsa0JBQWtCO1FBQ2xCLHNDQUFzQztRQUN0Qyx3QkFBd0I7S0FDekI7SUFDRCxhQUFhLEVBQUU7UUFDYixnQkFBZ0I7UUFDaEIsa0JBQWtCO0tBQ25CO0lBQ0QsaUJBQWlCLEVBQUU7UUFDakIsb0JBQW9CO1FBQ3BCLHVCQUF1QjtLQUN4QjtJQUNELGtCQUFrQixFQUFFO1FBQ2xCLG9CQUFvQjtRQUNwQix1QkFBdUI7S0FDeEI7Q0FDRixDQUFBO0FBSUQsU0FBUyxVQUFVLENBQUMsWUFBb0MsRUFBRSxjQUFjLEdBQUcsS0FBSyxFQUFFLEdBQUcsR0FBRyxJQUFJO0lBQzFGLE1BQU0sT0FBTyxHQUFHLElBQUksNEJBQWUsRUFBRSxDQUFDO0lBQ3RDLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFBO0lBQzNDLE1BQU0sU0FBUyxHQUE4QixJQUFJLEdBQUcsQ0FBQyxDQUFDLHdCQUF3QixFQUFFLHFCQUFxQixFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQTtJQUV6SCxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQzdCLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUE4QixDQUFDLElBQUksQ0FBQyxHQUFHO1lBQUUsU0FBUztRQUVwRSxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBOEIsQ0FBQyxDQUFBO1FBQ3RELElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQThCLENBQUMsQ0FBQTtJQUN6RixDQUFDO0lBRUQsSUFBSSxjQUFjO1FBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ2xELE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQTtBQUN6QixDQUFDO0FBRUQsa0JBQWUsVUFBVSxDQUFBIn0=