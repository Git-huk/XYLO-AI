import config from '../config.js'
import os from 'os'
import moment from 'moment'
import ms from 'ms'

const prefix = config.PREFIX
const startTime = Date.now()

export default [
  {
    name: 'botinfo',
    description: 'Get info about the bot',
    category: 'info',
    handler: async ({ msg, Dave, from }) => {
      const uptime = ms(Date.now() - startTime, { long: true })
      const text = `🤖 *Bot Info*\n\n• Name: XYLO-MD\n• Mode: ${config.MODE}\n• Prefix: ${config.PREFIX}\n• Platform: ${os.platform()}\n• Uptime: ${uptime}\n• Memory: ${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`
      await Dave.sendMessage(from, { text }, { quoted: msg })
    }
  },

  {
    name: 'groupinfo',
    description: 'Get info about the group',
    category: 'info',
    handler: async ({ msg, Dave, from, isGroup, groupMetadata }) => {
      if (!isGroup) {
        return Dave.sendMessage(from, { text: '❗ This command is for groups only.' }, { quoted: msg })
      }

      const { id, subject, creation, participants, owner } = groupMetadata
      const created = moment(creation * 1000).format('MMMM Do YYYY, h:mm:ss a')
      const size = participants.length

      const info = `👥 *Group Info:*\n\n• Name: ${subject}\n• ID: ${id}\n• Created: ${created}\n• Members: ${size}\n• Admin: ${owner?.split('@')[0] || 'Unknown'}`
      await Dave.sendMessage(from, { text: info }, { quoted: msg })
    }
  },
  {

    name: 'whois',

    description: 'Get info about a user (works in groups and DMs)',

    alias: ['user'],

    category: 'info',

    handler: async ({ msg, Dave, from, isGroup, groupMetadata, reply }) => {

      try {

        const mentioned = msg.mentionedJid?.[0]

        const quotedParticipant = msg.quoted?.key?.participant

        const sender = msg.key?.participant || msg.key?.remoteJid || ''

        const target = quotedParticipant || mentioned || sender

        if (!target) return reply('❌ Could not identify user.')

        const jid = target.split('@')[0]

        let pfp

        try {

          pfp = await Dave.profilePictureUrl(target, 'image')

        } catch {

          pfp = 'https://i.ibb.co/j3pRQf6/user.png'

        }

        let status = 'No bio'

try {

  const bioData = await Dave.fetchStatus(target)

  if (bioData?.status) status = bioData.status

} catch {}

        let role = 'N/A'

        if (isGroup && groupMetadata?.participants) {

          const user = groupMetadata.participants.find(u => u.id === target)

          if (user) role = user.admin ? '🛡 Admin' : '👤 Member'

        }

        const text = `👤 *User Info*\n\n• *Name:* ${msg.pushName || 'Unknown'}\n• *JID:* ${jid}\n• *Bio:* ${status}\n• *Role:* ${role}`

        await Dave.sendMessage(from, {

          image: { url: pfp },

          caption: text

        }, { quoted: msg })

      } catch (e) {

        reply('❌ Failed to get user info.')

      }

    }

  },

  {

    name: 'admins',

    description: 'List all admins in the group',

    category: 'info',

    handler: async ({ msg, Dave, from, isGroup, groupMetadata, reply }) => {

      if (!isGroup) return reply('❗ This command is group-only.')

      const participants = groupMetadata?.participants

      if (!participants || !Array.isArray(participants)) {

        return reply('❗ Participants info not available.')

      }

      const admins = participants.filter(p => p.admin).map(p => `• @${p.id.split('@')[0]}`)

      if (admins.length === 0) return reply('No admins found.')

      await Dave.sendMessage(from, {

        text: `👮 *Group Admins:*\n\n${admins.join('\n')}`,

        mentions: participants.filter(p => p.admin).map(p => p.id)

      }, { quoted: msg })

    }

  }
    
]