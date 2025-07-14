// antilinkDetection.js
import { getLinkDetectionMode } from './getLinkMode.js'
import { incrementWarning, resetWarning } from './warnings.js'

export const setupLinkDetection = (sock, isBotAdmin) => {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
      const groupJid = message.key.remoteJid
      if (!groupJid?.endsWith('@g.us') || message.key.fromMe) continue

      const mode = getLinkDetectionMode(groupJid)
      if (!mode) continue

      const msgText = message.message?.conversation ||
                      message.message?.extendedTextMessage?.text ||
                      message.message?.imageMessage?.caption ||
                      message.message?.videoMessage?.caption || ''

      const linkRegex = /(?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/gi
      if (!linkRegex.test(msgText)) continue

      const participant = message.key.participant || message.participant
      console.log(`🔗 Link detected in ${groupJid}:`, msgText)

      const metadata = await sock.groupMetadata(groupJid).catch(() => null)
      if (!metadata) continue

      const isAdmin = metadata.participants.some(p => p.id === participant && p.admin)
      const botIsAdmin = isBotAdmin(groupJid)

      if (!botIsAdmin) {
        console.log('❌ Bot is not admin. Ignoring.')
        continue
      }
      if (isAdmin) {
        console.log(`✅ Ignoring admin: ${participant}`)
        continue
      }

      await sock.sendMessage(groupJid, { delete: message.key }).catch(() => {})

      if (mode === 'warn') {
        const count = incrementWarning(groupJid, participant)
        await sock.sendMessage(groupJid, {
          text: `⚠️ @${participant.split('@')[0]}, links are not allowed!\nWarning: ${count}/3`,
          mentions: [participant]
        })

        if (count >= 3) {
          await sock.groupParticipantsUpdate(groupJid, [participant], 'remove')
          await sock.sendMessage(groupJid, {
            text: `🚫 @${participant.split('@')[0]} removed for repeated links.`,
            mentions: [participant]
          })
          resetWarning(groupJid, participant)
        }
      } else if (mode === 'kick') {
        await sock.groupParticipantsUpdate(groupJid, [participant], 'remove')
        await sock.sendMessage(groupJid, {
          text: `🚫 @${participant.split('@')[0]} removed for sending links.`,
          mentions: [participant]
        })
      }
    }
  })
}