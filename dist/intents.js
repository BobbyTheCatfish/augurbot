"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Intents = [
    {
        intent: discord_js_1.GatewayIntentBits.Guilds,
        events: [
            'guildCreate',
            'guildUpdate',
            'guildDelete',
            'guildAvailable',
            'guildUnavailable',
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
            'threadMembersUpdate',
            'stageInstanceCreate',
            'stageInstanceUpdate',
            'stageInstanceDelete',
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.GuildMembers,
        events: [
            'guildMemberAdd',
            'guildMemberUpdate',
            'guildMemberRemove',
            'guildMembersChunk',
            'guildMemberAvailable',
            'threadMembersUpdate'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.GuildModeration,
        events: [
            'guildAuditLogEntryCreate',
            'guildBanAdd',
            'guildBanRemove'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.GuildEmojisAndStickers,
        events: [
            'emojiCreate',
            'emojiDelete',
            'emojiUpdate',
            'stickerCreate',
            'stickerDelete',
            'stickerUpdate'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.GuildIntegrations,
        events: [
            'guildIntegrationsUpdate',
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.GuildWebhooks,
        events: [
            'webhooksUpdate',
            'webhookUpdate'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.GuildInvites,
        events: [
            'inviteCreate',
            'inviteDelete'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.GuildVoiceStates,
        events: [
            'voiceStateUpdate'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.GuildPresences,
        events: [
            'presenceUpdate',
            'userUpdate'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.GuildMessages,
        events: [
            'messageCreate',
            'messageUpdate',
            'messageDelete',
            'messageDeleteBulk'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.GuildMessageReactions,
        events: [
            'messageReactionAdd',
            'messageReactionRemove',
            'messageReactionRemoveAll',
            'messageReactionRemoveEmoji'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.GuildMessageTyping,
        events: [
            'typingStart'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.DirectMessages,
        events: [
            'messageCreate',
            'messageUpdate',
            'messageDelete',
            'channelPinsUpdate'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.DirectMessageReactions,
        events: [
            'messageReactionAdd',
            'messageReactionRemove',
            'messageReactionRemoveAll',
            'messageReactionRemoveEmoji'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.DirectMessageTyping,
        events: [
            'typingStart'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.MessageContent,
        events: [
            'messageCreate',
            'messageUpdate',
            'messageDelete',
            'channelPinsUpdate'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.GuildScheduledEvents,
        events: [
            'guildScheduledEventCreate',
            'guildScheduledEventUpdate',
            'guildScheduledEventDelete',
            'guildScheduledEventUserAdd',
            'guildScheduledEventUserRemove'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.AutoModerationConfiguration,
        events: [
            'autoModerationRuleCreate',
            'autoModerationRuleUpdate',
            'autoModerationRuleDelete'
        ]
    },
    {
        intent: discord_js_1.GatewayIntentBits.AutoModerationExecution,
        events: [
            'autoModerationActionExecution'
        ]
    }
];
//Not sure if these two need any intents, but I don't think they do
//.set("applicationCommandPermissionsUpdate", )
//.set("interactionCreate", )
function calcIntent(clientEvents, dms = true) {
    const intents = [];
    for (const intent of Intents) {
        if (intent.events.find((e) => clientEvents.includes(e)))
            intents.push(intent.intent);
    }
    if (!dms)
        intents.filter(i => ![discord_js_1.GatewayIntentBits.DirectMessages, discord_js_1.GatewayIntentBits.DirectMessageReactions, discord_js_1.GatewayIntentBits.DirectMessageTyping].includes(i));
    return intents;
}
exports.default = calcIntent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pbnRlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTZEO0FBRzdELE1BQU0sT0FBTyxHQUF1RDtJQUNsRTtRQUNFLE1BQU0sRUFBRSw4QkFBaUIsQ0FBQyxNQUFNO1FBQ2hDLE1BQU0sRUFBRTtZQUNOLGFBQWE7WUFDYixhQUFhO1lBQ2IsYUFBYTtZQUNiLGdCQUFnQjtZQUNoQixrQkFBa0I7WUFDbEIsWUFBWTtZQUNaLFlBQVk7WUFDWixZQUFZO1lBQ1osZUFBZTtZQUNmLGVBQWU7WUFDZixlQUFlO1lBQ2YsbUJBQW1CO1lBQ25CLGNBQWM7WUFDZCxjQUFjO1lBQ2QsY0FBYztZQUNkLGdCQUFnQjtZQUNoQixvQkFBb0I7WUFDcEIscUJBQXFCO1lBQ3JCLHFCQUFxQjtZQUNyQixxQkFBcUI7WUFDckIscUJBQXFCO1NBQ3RCO0tBQ0Y7SUFDRDtRQUNFLE1BQU0sRUFBRSw4QkFBaUIsQ0FBQyxZQUFZO1FBQ3RDLE1BQU0sRUFBRTtZQUNOLGdCQUFnQjtZQUNoQixtQkFBbUI7WUFDbkIsbUJBQW1CO1lBQ25CLG1CQUFtQjtZQUNuQixzQkFBc0I7WUFDdEIscUJBQXFCO1NBQ3RCO0tBQ0Y7SUFDRDtRQUNFLE1BQU0sRUFBRSw4QkFBaUIsQ0FBQyxlQUFlO1FBQ3pDLE1BQU0sRUFBRTtZQUNOLDBCQUEwQjtZQUMxQixhQUFhO1lBQ2IsZ0JBQWdCO1NBQ2pCO0tBQ0Y7SUFDRDtRQUNFLE1BQU0sRUFBRSw4QkFBaUIsQ0FBQyxzQkFBc0I7UUFDaEQsTUFBTSxFQUFFO1lBQ04sYUFBYTtZQUNiLGFBQWE7WUFDYixhQUFhO1lBQ2IsZUFBZTtZQUNmLGVBQWU7WUFDZixlQUFlO1NBQ2hCO0tBQ0Y7SUFDRDtRQUNFLE1BQU0sRUFBRSw4QkFBaUIsQ0FBQyxpQkFBaUI7UUFDM0MsTUFBTSxFQUFFO1lBQ04seUJBQXlCO1NBQzFCO0tBQ0Y7SUFDRDtRQUNFLE1BQU0s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