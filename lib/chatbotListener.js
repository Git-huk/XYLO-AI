import axios from 'axios'
import config from '../config.js'
import { getConfig } from './configdb.js'

export default async function setupChatbotListener(Dave) {
  Dave.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages?.[0]
    if (!msg?.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const sender = msg.key.participant || msg.key.remoteJid
    const type = Object.keys(msg.message)[0]

    // Extract body
    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      ''

    const isCmd = body.startsWith(config.PREFIX || '.')

    // Normalize bot ID
    const botJid = Dave.user.id.split(':')[0] + '@s.whatsapp.net'

    // Detect mention and reply
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {}
    const mentioned = contextInfo.mentionedJid?.some(jid => jid.includes(botJid)) || false
    const repliedToBot = contextInfo.participant === botJid

    // Get chatbot config
    const aiStateRaw = await getConfig('ai_state') || '{}'
    const aiState = JSON.parse(aiStateRaw)

    const isPm = !isGroup
    const aiOnInPm = aiState.IB === 'true'
    const aiOnInGc = aiState.GC === 'true'

    if (
      (isPm && aiOnInPm || isGroup && aiOnInGc)
      && !isCmd
      && (mentioned || repliedToBot)
    ) {
      try {
        await Dave.sendPresenceUpdate('composing', from)

        const { data } = await axios.post('https://xylo-ai.onrender.com/ask', {
          userId: sender,
          message: body
        })

        await Dave.sendPresenceUpdate('paused', from)

        if (data?.reply) {
          await Dave.sendMessage(from, { text: data.reply }, { quoted: msg })
          await Dave.sendMessage(from, {
            react: {
              text: '✅',
              key: msg.key
            }
          })
        }
      } catch (err) {
        await Dave.sendPresenceUpdate('paused', from)
        console.error('🤖 AI Error:', err.message)
        await Dave.sendMessage(from, {
          text: '⚠️ Xylo AI is temporarily unavailable.'
        }, { quoted: msg })
      }
    }
  })
}