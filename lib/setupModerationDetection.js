import { getLinkDetectionMode } from './getLinkMode.js'
import { getAntiNewsletterMode } from './getAntiNewsletterMode.js'
import { incrementWarning, resetWarning } from './warnings.js'

const newsletterWarnings = {}

export const setupModerationDetection = (sock, isBotAdmin) => {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
      const groupJid = message.key.remoteJid
      if (!groupJid?.endsWith('@g.us') || message.key.fromMe) continue

      const participant = message.key.participant || message.participant
      const metadata = await sock.groupMetadata(groupJid).catch(() => null)
      if (!metadata) continue

      const isAdmin = metadata.participants.some(p => p.id === participant && p.admin)
      const botIsAdmin = isBotAdmin(groupJid)
      if (!botIsAdmin) continue

      // === 🧷 LINK DETECTION ===
      const linkMode = getLinkDetectionMode(groupJid)
      if (linkMode && linkMode !== 'off') {
        const msgText = message.message?.conversation ||
                        message.message?.extendedTextMessage?.text ||
                        message.message?.imageMessage?.caption ||
                        message.message?.videoMessage?.caption || ''

        const linkRegex = /(?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/gi
        if (linkRegex.test(msgText) && !isAdmin) {
          console.log(`🔗 Link detected in ${groupJid}:`, msgText)
          await sock.sendMessage(groupJid, { delete: message.key }).catch(() => {})

          if (linkMode === 'warn') {
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
          } else if (linkMode === 'kick') {
            await sock.groupParticipantsUpdate(groupJid, [participant], 'remove')
            await sock.sendMessage(groupJid, {
              text: `🚫 @${participant.split('@')[0]} removed for sending links.`,
              mentions: [participant]
            })
          }
        }
      }

      // === 📣 CHANNEL/NEWSLETTER DETECTION ===
      const newsMode = getAntiNewsletterMode(groupJid)
      if (newsMode && newsMode !== 'off') {
        const contextInfo = message.message?.extendedTextMessage?.contextInfo ||
                            message.message?.imageMessage?.contextInfo ||
                            message.message?.videoMessage?.contextInfo ||
                            message.message?.documentMessage?.contextInfo

        const isForwardedNewsletter = contextInfo?.forwardedNewsletterMessageInfo
        if (isForwardedNewsletter && !isAdmin) {
          console.log(`📣 Forwarded channel detected in ${groupJid}`)

          await sock.sendMessage(groupJid, { delete: message.key }).catch(() => {})

          if (newsMode === 'warn') {
            const key = `${groupJid}_${participant}`
            newsletterWarnings[key] = (newsletterWarnings[key] || 0) + 1
            const count = newsletterWarnings[key]

            await sock.sendMessage(groupJid, {
              text: `⚠️ @${participant.split('@')[0]}, forwarded channel messages are not allowed.\nWarning: ${count}/3`,
              mentions: [participant]
            })

            if (count >= 3) {
              await sock.groupParticipantsUpdate(groupJid, [participant], 'remove')
              await sock.sendMessage(groupJid, {
                text: `🚫 @${participant.split('@')[0]} removed for repeated forwarded channel messages.`,
                mentions: [participant]
              })
              newsletterWarnings[key] = 0
            }
          } else if (newsMode === 'kick') {
            await sock.groupParticipantsUpdate(groupJid, [participant], 'remove')
            await sock.sendMessage(groupJid, {
              text: `🚫 @${participant.split('@')[0]} removed for sharing forwarded channel messages.`,
              mentions: [participant]
            })
          }
        }
      }
    }
  })
}