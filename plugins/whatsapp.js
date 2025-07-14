// 📁 plugins/whatsapp.js
import { downloadMediaMessage } from 'baileys'
import fs from 'fs'

export default [
  {
    name: 'unsend',
    aliases: ['delmsg'],
    description: 'Delete your sent message (reply only)',
    category: 'whatsapp',
    handler: async ({ msg, Dave, from }) => {
      const ctx = msg.message?.extendedTextMessage?.contextInfo
      if (!ctx?.stanzaId) {
        return Dave.sendMessage(from, { text: '❌ Reply to a message you sent.' }, { quoted: msg })
      }

      await Dave.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: true,
          id: ctx.stanzaId,
          participant: Dave.user.id
        }
      })
    }
  },

  {
    name: 'forward',
    aliases: ['forcefwd'],
    description: 'Force forward any quoted media',
    category: 'whatsapp',
    handler: async ({ msg, Dave, from }) => {
      const ctx = msg.message?.extendedTextMessage?.contextInfo
      if (!ctx?.quotedMessage) {
        return Dave.sendMessage(from, { text: '❌ Reply to a media message to forward it.' }, { quoted: msg })
      }

      await Dave.sendMessage(from, ctx.quotedMessage, { quoted: msg })
    }
  },

  {
    name: 'block',
    description: 'Block a user (reply only)',
    category: 'whatsapp',
    handler: async ({ msg, Dave, isOwner, from }) => {
      if (!isOwner) return Dave.sendMessage(from, { text: '❌ Only owners can block.' }, { quoted: msg })
      const jid = msg.message?.extendedTextMessage?.contextInfo?.participant
      if (!jid) return Dave.sendMessage(from, { text: '❌ Reply to a user.' }, { quoted: msg })
      await Dave.updateBlockStatus(jid, 'block')
      await Dave.sendMessage(from, { text: `✅ Blocked ${jid}` })
    }
  },

  {
    name: 'unblock',
    description: 'Unblock a user (reply only)',
    category: 'whatsapp',
    handler: async ({ msg, Dave, isOwner, from }) => {
      if (!isOwner) return Dave.sendMessage(from, { text: '❌ Only owners can unblock.' }, { quoted: msg })
      const jid = msg.message?.extendedTextMessage?.contextInfo?.participant
      if (!jid) return Dave.sendMessage(from, { text: '❌ Reply to a user.' }, { quoted: msg })
      await Dave.updateBlockStatus(jid, 'unblock')
      await Dave.sendMessage(from, { text: `✅ Unblocked ${jid}` })
    }
  },

  {
    name: 'delete',
    aliases: ['delchat'],
    description: 'Delete full chat permanently',
    category: 'whatsapp',
    handler: async ({ Dave, from, isOwner, msg }) => {
      if (!isOwner) return Dave.sendMessage(from, { text: '❌ Only owners can delete chat.' }, { quoted: msg })
      await Dave.chatModify({ delete: true }, from)
      await Dave.sendMessage(from, { text: '🗑️ Chat deleted.' })
    }
  },

  {
    name: 'report',
    description: 'Report a message (reply only)',
    category: 'whatsapp',
    handler: async ({ msg, Dave, from }) => {
      const ctx = msg.message?.extendedTextMessage?.contextInfo
      if (!ctx?.stanzaId || !ctx?.participant) {
        return Dave.sendMessage(from, { text: '❌ Reply to a message to report.' }, { quoted: msg })
      }

      await Dave.sendMessage(from, {
        text: `⚠️ Report sent to WhatsApp (simulated)`
      }, { quoted: msg })
    }
  },

  {
    name: 'clear',
    aliases: ['clearchat'],
    description: 'Clear chat with user or group',
    category: 'whatsapp',
    handler: async ({ msg, Dave, from, isOwner }) => {
      if (!isOwner) return Dave.sendMessage(from, { text: '❌ Only owners can clear chats.' }, { quoted: msg })
      try {
        await Dave.chatModify({ clear: { message: { id: msg.key.id, fromMe: true } } }, from)
        await Dave.sendMessage(from, { text: '✅ Chat cleared.' })
      } catch (e) {
        await Dave.sendMessage(from, { text: `❌ Error clearing chat: ${e.message}` }, { quoted: msg })
      }
    }
  },

  {
    name: 'pin',
    description: 'Pin chat',
    category: 'whatsapp',
    handler: async ({ Dave, from, isOwner, msg }) => {
      if (!isOwner) return Dave.sendMessage(from, { text: '❌ Only owners can pin.' }, { quoted: msg })
      try {
        await Dave.chatModify({ pin: true }, from)
        await Dave.sendMessage(from, { text: '📌 Chat pinned.' })
      } catch (e) {
        await Dave.sendMessage(from, { text: `❌ Error pinning chat: ${e.message}` }, { quoted: msg })
      }
    }
  },

  {
    name: 'unpin',
    description: 'Unpin chat',
    category: 'whatsapp',
    handler: async ({ Dave, from, isOwner, msg }) => {
      if (!isOwner) return Dave.sendMessage(from, { text: '❌ Only owners can unpin.' }, { quoted: msg })
      try {
        await Dave.chatModify({ pin: false }, from)
        await Dave.sendMessage(from, { text: '❌ Chat unpinned.' })
      } catch (e) {
        await Dave.sendMessage(from, { text: `❌ Error unpinning chat: ${e.message}` }, { quoted: msg })
      }
    }
  },

  {
    name: 'vv',
    category: 'tools',
    desc: 'Open view-once media (image/video)',
    async handler({ m, reply, Dave }) {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      if (!quoted) return reply('⚠️ Reply to a view-once image/video.')

      const quotedType = Object.keys(quoted)[0]
      if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(quotedType))
        return reply('⚠️ Quoted message must be image, video, or audio.')

      try {
        const buffer = await Dave.downloadMediaMessage({ message: quoted })
        if (!buffer) return reply('❌ Failed to download media.')

        if (quotedType === 'imageMessage') {
          await Dave.sendMessage(m.from, { image: buffer, caption: '📸 View Once Opened' })
        } else if (quotedType === 'videoMessage') {
          await Dave.sendMessage(m.from, { video: buffer, caption: '🎞️ View Once Opened' })
        } else if (quotedType === 'audioMessage') {
          await Dave.sendMessage(m.from, { audio: buffer, caption: '🔊 View Once Opened' })
        }
      } catch (e) {
        reply('❌ Error opening media: ' + e.message)
      }
    }
  },

  // Open view-once media and forward to sender's DM (private chat)
  {
    name: 'vv2',
    category: 'tools',
    desc: 'Open view-once media and send to your DM',
    async handler({ m, reply, Dave, sender }) {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      if (!quoted) return reply('⚠️ Reply to a view-once image/video.')

      const quotedType = Object.keys(quoted)[0]
      if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(quotedType))
        return reply('⚠️ Quoted message must be image, video, or audio.')

      try {
        const buffer = await Dave.downloadMediaMessage({ message: quoted })
        if (!buffer) return reply('❌ Failed to download media.')

        const jid = sender
        if (quotedType === 'imageMessage') {
          await Dave.sendMessage(jid, { image: buffer, caption: '📥 Forwarded View Once' })
        } else if (quotedType === 'videoMessage') {
          await Dave.sendMessage(jid, { video: buffer, caption: '📥 Forwarded View Once' })
        } else if (quotedType === 'audioMessage') {
          await Dave.sendMessage(jid, { audio: buffer, caption: '📥 Forwarded View Once' })
        }
        reply('✅ Media sent to your DM.')
      } catch (e) {
        reply('❌ Error forwarding media: ' + e.message)
      }
    }
  },

  {
    name: 'tovv',
    description: 'Convert quoted media to view-once',
    category: 'whatsapp',
    handler: async ({ msg, Dave, from }) => {
      const ctx = msg.message?.extendedTextMessage?.contextInfo
      const quoted = ctx?.quotedMessage
      if (!quoted) return Dave.sendMessage(from, { text: '❌ Reply to a media message.' }, { quoted: msg })

      const type = Object.keys(quoted)[0]
      if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) {
        return Dave.sendMessage(from, { text: '❌ Only image, video, or audio can be converted.' }, { quoted: msg })
      }

      const media = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { logger: undefined })
      const caption = quoted?.[type]?.caption || ''
      const ptt = quoted?.audioMessage?.ptt || false

      const payload = {
        [type]: media,
        caption,
        mimetype: quoted?.[type]?.mimetype,
        viewOnce: true
      }

      if (type === 'audioMessage') {
        payload.ptt = ptt
      }

      await Dave.sendMessage(from, payload, { quoted: msg })
    }
  }
]