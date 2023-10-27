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
    return intents;
}
exports.default = calcIntent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2ludGVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBNkQ7QUFHN0QsTUFBTSxPQUFPLEdBQXVEO0lBQ2xFO1FBQ0UsTUFBTSxFQUFFLDhCQUFpQixDQUFDLE1BQU07UUFDaEMsTUFBTSxFQUFFO1lBQ04sYUFBYTtZQUNiLGFBQWE7WUFDYixhQUFhO1lBQ2IsZ0JBQWdCO1lBQ2hCLGtCQUFrQjtZQUNsQixZQUFZO1lBQ1osWUFBWTtZQUNaLFlBQVk7WUFDWixlQUFlO1lBQ2YsZUFBZTtZQUNmLGVBQWU7WUFDZixtQkFBbUI7WUFDbkIsY0FBYztZQUNkLGNBQWM7WUFDZCxjQUFjO1lBQ2QsZ0JBQWdCO1lBQ2hCLG9CQUFvQjtZQUNwQixxQkFBcUI7WUFDckIscUJBQXFCO1lBQ3JCLHFCQUFxQjtZQUNyQixxQkFBcUI7U0FDdEI7S0FDRjtJQUNEO1FBQ0UsTUFBTSxFQUFFLDhCQUFpQixDQUFDLFlBQVk7UUFDdEMsTUFBTSxFQUFFO1lBQ04sZ0JBQWdCO1lBQ2hCLG1CQUFtQjtZQUNuQixtQkFBbUI7WUFDbkIsbUJBQW1CO1lBQ25CLHNCQUFzQjtZQUN0QixxQkFBcUI7U0FDdEI7S0FDRjtJQUNEO1FBQ0UsTUFBTSxFQUFFLDhCQUFpQixDQUFDLGVBQWU7UUFDekMsTUFBTSxFQUFFO1lBQ04sMEJBQTBCO1lBQzFCLGFBQWE7WUFDYixnQkFBZ0I7U0FDakI7S0FDRjtJQUNEO1FBQ0UsTUFBTSxFQUFFLDhCQUFpQixDQUFDLHNCQUFzQjtRQUNoRCxNQUFNLEVBQUU7WUFDTixhQUFhO1lBQ2IsYUFBYTtZQUNiLGFBQWE7WUFDYixlQUFlO1lBQ2YsZUFBZTtZQUNmLGVBQWU7U0FDaEI7S0FDRjtJQUNEO1FBQ0UsTUFBTSxFQUFFLDhCQUFpQixDQUFDLGlCQUFpQjtRQUMzQyxNQUFNLEVBQUU7WUFDTix5QkFBeUI7U0FDMUI7S0FDRjtJQUNEO1FBQ0UsTUFBTSxFQUFF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