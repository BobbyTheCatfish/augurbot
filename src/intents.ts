import { GatewayIntentBits, ClientEvents } from "discord.js";


const Intents: {intent: number, events: (keyof ClientEvents)[]}[] = [
  {
    intent: GatewayIntentBits.Guilds,
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
    intent: GatewayIntentBits.GuildMembers,
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
    intent: GatewayIntentBits.GuildModeration,
    events: [
      'guildAuditLogEntryCreate',
      'guildBanAdd',
      'guildBanRemove'
    ]
  },
  {
    intent: GatewayIntentBits.GuildEmojisAndStickers,
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
    intent: GatewayIntentBits.GuildIntegrations,
    events: [
      'guildIntegrationsUpdate',
    ]
  },
  {
    intent: GatewayIntentBits.GuildWebhooks,
    events: [
      'webhooksUpdate',
      'webhookUpdate'
    ]
  },
  {
    intent: GatewayIntentBits.GuildInvites,
    events: [
      'inviteCreate',
      'inviteDelete'
    ]
  },
  {
    intent: GatewayIntentBits.GuildVoiceStates,
    events: [
      'voiceStateUpdate'
    ]
  },
  {
    intent: GatewayIntentBits.GuildPresences,
    events: [
      'presenceUpdate',
      'userUpdate'
    ]
  },
  {
    intent: GatewayIntentBits.GuildMessages,
    events: [
      'messageCreate',
      'messageUpdate',
      'messageDelete',
      'messageDeleteBulk'
    ]
  },
  {
    intent: GatewayIntentBits.GuildMessageReactions,
    events: [
      'messageReactionAdd',
      'messageReactionRemove',
      'messageReactionRemoveAll',
      'messageReactionRemoveEmoji'
    ]
  },
  {
    intent: GatewayIntentBits.GuildMessageTyping,
    events: [
      'typingStart'
    ]
  },
  {
    intent: GatewayIntentBits.DirectMessages,
    events: [
      'messageCreate',
      'messageUpdate',
      'messageDelete',
      'channelPinsUpdate'
    ]
  },
  {
    intent: GatewayIntentBits.DirectMessageReactions,
    events: [
      'messageReactionAdd',
      'messageReactionRemove',
      'messageReactionRemoveAll',
      'messageReactionRemoveEmoji'
    ]
  },
  {
    intent: GatewayIntentBits.DirectMessageTyping,
    events: [
      'typingStart'
    ]
  },
  {
    intent: GatewayIntentBits.MessageContent,
    events: [
      'messageCreate',
      'messageUpdate',
      'messageDelete',
      'channelPinsUpdate'
    ]
  },
  {
    intent: GatewayIntentBits.GuildScheduledEvents,
    events: [
      'guildScheduledEventCreate',
      'guildScheduledEventUpdate',
      'guildScheduledEventDelete',
      'guildScheduledEventUserAdd',
      'guildScheduledEventUserRemove'
    ]
  },
  {
    intent: GatewayIntentBits.AutoModerationConfiguration,
    events: [
      'autoModerationRuleCreate',
      'autoModerationRuleUpdate',
      'autoModerationRuleDelete'
    ]
  },
  {
    intent: GatewayIntentBits.AutoModerationExecution,
    events: [
      'autoModerationActionExecution'
    ]
  }
]

//Not sure if these two need any intents, but I don't think they do
//.set("applicationCommandPermissionsUpdate", )
//.set("interactionCreate", )


function calcIntent(clientEvents: (keyof ClientEvents)[], dms = true) {
  const intents = []
  for (const intent of Intents) {
    if (intent.events.find((e) => clientEvents.includes(e))) intents.push(intent.intent)
  }
  if (!dms) intents.filter(i => ![GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping].includes(i))
  return intents
}

export default calcIntent
