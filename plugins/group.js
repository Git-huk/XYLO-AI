import fs from 'fs'
import config from '../config.js'

const prefix = config.PREFIX
const groupDBPath = './lib/group.json'
const warnDBPath = './lib/warn.json'

const groupData = fs.existsSync(groupDBPath) ? JSON.parse(fs.readFileSync(groupDBPath)) : {}
const warnData = fs.existsSync(warnDBPath) ? JSON.parse(fs.readFileSync(warnDBPath)) : {}

function saveGroup() {
  fs.writeFileSync(groupDBPath, JSON.stringify(groupData, null, 2))
}

function saveWarns() {
  fs.writeFileSync(warnDBPath, JSON.stringify(warnData, null, 2))
}

function ensureGroup(id) {
  if (!groupData[id]) {
    groupData[id] = {
      welcome: false,
      goodbye: false,
      welcomeMsg: 'Welcome @user to @group @pp',
      goodbyeMsg: 'Goodbye @user from @group 😭 @pp',
      adminEvent: false,
      antilinkMode: 'off',
      antinewsletterMode: 'off'
    }
    saveGroup()
  }
}

export default [
  {
    name: 'welcome',
    description: 'Enable/Disable welcome message',
    category: 'group',
    handler: async ({ from, args, isAdmin, reply }) => {
      if (!from.endsWith('@g.us')) return
      if (!isAdmin) return reply('❌ Admin only.')
      ensureGroup(from)
      const opt = args[0]?.toLowerCase()
      if (!['on', 'off'].includes(opt)) return reply(`Usage:\n${prefix}welcome on/off`)
      groupData[from].welcome = opt === 'on'
      saveGroup()
      reply(`✅ Welcome is now *${opt.toUpperCase()}*.`)
    }
  },
  {
    name: 'goodbye',
    description: 'Enable/Disable goodbye message',
    category: 'group',
    handler: async ({ from, args, isAdmin, reply }) => {
      if (!from.endsWith('@g.us')) return
      if (!isAdmin) return reply('❌ Admin only.')
      ensureGroup(from)
      const opt = args[0]?.toLowerCase()
      if (!['on', 'off'].includes(opt)) return reply(`Usage:\n${prefix}goodbye on/off`)
      groupData[from].goodbye = opt === 'on'
      saveGroup()
      reply(`✅ Goodbye is now *${opt.toUpperCase()}*.`)
    }
  },
  {
    name: 'setwelcome',
    description: 'Set custom welcome message',
    category: 'group',
    handler: async ({ from, args, isAdmin, reply }) => {
      if (!from.endsWith('@g.us')) return
      if (!isAdmin) return reply('❌ Admin only.')
      ensureGroup(from)
      const text = args.join(' ')
      if (!text) return reply(`Usage:\n${prefix}setwelcome Welcome @user to @group @pp`)
      groupData[from].welcomeMsg = text
      saveGroup()
      reply('✅ Welcome message updated.')
    }
  },
  {
    name: 'setgoodbye',
    description: 'Set custom goodbye message',
    category: 'group',
    handler: async ({ from, args, isAdmin, reply }) => {
      if (!from.endsWith('@g.us')) return
      if (!isAdmin) return reply('❌ Admin only.')
      ensureGroup(from)
      const text = args.join(' ')
      if (!text) return reply(`Usage:\n${prefix}setgoodbye Goodbye @user from @group @pp`)
      groupData[from].goodbyeMsg = text
      saveGroup()
      reply('✅ Goodbye message updated.')
    }
  },
  {
    name: 'adminevent',
    description: 'Enable/Disable admin promote/demote events',
    category: 'group',
    handler: async ({ from, args, isAdmin, reply }) => {
      if (!from.endsWith('@g.us')) return
      if (!isAdmin) return reply('❌ Admin only.')
      ensureGroup(from)
      const opt = args[0]?.toLowerCase()
      if (!['on', 'off'].includes(opt)) return reply(`Usage:\n${prefix}adminevent on/off`)
      groupData[from].adminEvent = opt === 'on'
      saveGroup()
      reply(`✅ Admin events are *${opt.toUpperCase()}*.`)
    }
  },
  {
    name: 'antilink',
    description: 'Set antilink mode (off/delete/warn/kick)',
    category: 'group',
    handler: async ({ from, args, isAdmin, reply }) => {
      if (!from.endsWith('@g.us')) return
      if (!isAdmin) return reply('❌ Admin only.')
      ensureGroup(from)
      const opt = args[0]?.toLowerCase()
      if (!['off', 'delete', 'warn', 'kick'].includes(opt)) {
        return reply(`Usage:\n${prefix}antilink off | delete | warn | kick`)
      }
      groupData[from].antilinkMode = opt
      saveGroup()
      reply(`✅ Antilink mode is *${opt.toUpperCase()}*.`)
    }
  },
  {
    name: 'antic',
    description: 'Set antic mode (off/delete/warn/kick)',
    category: 'group',
    handler: async ({ from, args, isAdmin, reply }) => {
      if (!from.endsWith('@g.us')) return
      if (!isAdmin) return reply('❌ Admin only.')
      ensureGroup(from)
      const opt = args[0]?.toLowerCase()
      if (!['off', 'delete', 'warn', 'kick'].includes(opt)) {
        return reply(`Usage:\n${prefix}antic off | delete | warn | kick`)
      }
      groupData[from].antinewsletterMode = opt
      saveGroup()
      reply(`✅ AntiChannel mode is *${opt.toUpperCase()}*.`)
    }
  },
  {
    name: 'warns',
    description: 'Check user warn count',
    category: 'group',
    handler: async ({ msg, from, Dave, reply }) => {
      const jid = msg.message?.extendedTextMessage?.contextInfo?.participant ||
                  msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      if (!jid) return reply(`Tag or reply user\n${prefix}warns @user`)
      const count = warnData[from]?.[jid] || 0
      await Dave.sendMessage(from, {
        text: `⚠️ @${jid.split('@')[0]} has *${count}* warning(s).`,
        mentions: [jid]
      }, { quoted: msg })
    }
  },
  {
    name: 'resetwarn',
    description: 'Reset warnings for a user',
    category: 'group',
    handler: async ({ msg, from, Dave, isAdmin, reply }) => {
      if (!isAdmin) return reply('❌ Admin only.')
      const jid = msg.message?.extendedTextMessage?.contextInfo?.participant ||
                  msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      if (!jid) return reply(`Tag or reply user\n${prefix}resetwarn @user`)
      warnData[from] = warnData[from] || {}
      warnData[from][jid] = 0
      saveWarns()
      await Dave.sendMessage(from, {
        text: `✅ Warnings for @${jid.split('@')[0]} have been reset.`,
        mentions: [jid]
      }, { quoted: msg })
    }
  },
  {
    name: 'kick',
    description: 'Kick mentioned or replied user',
    category: 'group',
    handler: async ({ msg, from, Dave, isAdmin, botAdmin, reply }) => {
      if (!isAdmin) return reply('❌ Admin only.')
      if (!botAdmin) return reply('❌ I need admin rights.')
      const jid = msg.message?.extendedTextMessage?.contextInfo?.participant ||
                  msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      if (!jid) return reply(`Tag or reply user\nkick @user`)
      await Dave.groupParticipantsUpdate(from, [jid], 'remove')
    }
  },
  {
    name: 'promote',
    description: 'Promote user to admin',
    category: 'group',
    handler: async ({ msg, from, Dave, isAdmin, botAdmin, reply }) => {
      if (!isAdmin) return reply('❌ Admin only.')
      if (!botAdmin) return reply('❌ I need admin rights.')
      const jid = msg.message?.extendedTextMessage?.contextInfo?.participant ||
                  msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      if (!jid) return reply(`Tag or reply user\npromote @user`)
      await Dave.groupParticipantsUpdate(from, [jid], 'promote')
    }
  },
  {
    name: 'demote',
    description: 'Demote user from admin',
    category: 'group',
    handler: async ({ msg, from, Dave, isAdmin, botAdmin, reply }) => {
      if (!isAdmin) return reply('❌ Admin only.')
      if (!botAdmin) return reply('❌ I need admin rights.')
      const jid = msg.message?.extendedTextMessage?.contextInfo?.participant ||
                  msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      if (!jid) return reply(`Tag or reply user\ndemote @user`)
      await Dave.groupParticipantsUpdate(from, [jid], 'demote')
    }
  },
  {
    name: 'group',
    description: 'Open or close group',
    category: 'group',
    handler: async ({ args, from, Dave, isAdmin, botAdmin, reply }) => {
      if (!isAdmin) return reply('❌ Admin only.')
      if (!botAdmin) return reply('❌ I need admin rights.')
      const opt = args[0]?.toLowerCase()
      if (!['open', 'close'].includes(opt)) return reply(`Usage:\n${prefix}group open | close`)
      await Dave.groupSettingUpdate(from, opt === 'open' ? 'not_announcement' : 'announcement')
      reply(`✅ Group is now *${opt.toUpperCase()}*.`)
    }
  },
  {
  name: 'tagall',
  description: 'Mention all group members with a custom message',
  category: 'group',
  handler: async ({ from, Dave, isAdmin, reply, args }) => {
    if (!isAdmin) return reply('❌ Admin only.')

    try {
      const metadata = await Dave.groupMetadata(from)
      const participants = metadata.participants

      if (!participants || participants.length === 0)
        return reply('⚠️ No members found.')

      const mentions = participants.map(p => p.id)
      const mentionText = participants
        .map(p => `👤 @${p.id.split('@')[0]}`)
        .join('\n')

      let message = ''
      if (args.length === 0) {
        message = `*📢 Attention Everyone!*\n\n${mentionText}`
      } else {
        message = `${args.join(' ')}\n\n${mentionText}`
      }

      await Dave.sendMessage(from, { text: message, mentions })
    } catch (err) {
      reply('❌ Failed to fetch group members.')
    }
  }
}
]
