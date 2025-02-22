import { IntentsBitField, GatewayIntentsString, ClientEvents } from "discord.js";

const Intents: Record<GatewayIntentsString, (keyof ClientEvents)[]> = {
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
}



function calcIntent(clientEvents: (keyof ClientEvents)[], messageContent = false, dms = true) {
  const intents = new IntentsBitField();
  const uniqueIntents = new Set(clientEvents)
  const dmIntents: Set<GatewayIntentsString> = new Set(["DirectMessageReactions", "DirectMessageTyping", "DirectMessages"])

  for (const intent in Intents) {
    if (dmIntents.has(intent as GatewayIntentsString) && !dms) continue;

    const events = Intents[intent as GatewayIntentsString]
    if (events.find(e => uniqueIntents.has(e))) intents.add(intent as GatewayIntentsString)
  }

  if (messageContent) intents.add("MessageContent");
  return intents.bitfield
}

export default calcIntent
