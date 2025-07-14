import axios from 'axios'
import config from '../config.js'
import { setConfig, getConfig } from '../lib/configdb.js'

let AI_STATE = { IB: "false", GC: "false" }

// Load saved config
;(async () => {
  const saved = await getConfig("ai_state")
  if (saved) AI_STATE = JSON.parse(saved)
})()

export default [
  {
    name: 'chatbot',
    category: 'ai',
    desc: 'Toggle Xylo AI via reply menu',
    async handler({ Dave, msg, from, isOwner }) {
      if (!isOwner) return Dave.sendMessage(from, {
        text: '⛔ Only the bot owner can use this command.'
      }, { quoted: msg })

      const caption = `🤖 *Xylo AI Chatbot Toggle*\n
1. Enable for PM only  
2. Enable for Groups only  
3. Enable for All chats  
4. Disable AI

_Current State:_  
• PM: ${AI_STATE.IB === 'true' ? '✅ ON' : '❌ OFF'}  
• Group: ${AI_STATE.GC === 'true' ? '✅ ON' : '❌ OFF'}  
\n_Reply with 1, 2, 3 or 4 to toggle_`

      const sent = await Dave.sendMessage(from, {
        image: { url: 'https://i.postimg.cc/rFV2pJW5/IMG-20250603-WA0017.jpg' },
        caption
      }, { quoted: msg })

      const msgId = sent.key.id

      const handler = async ({ messages }) => {
        const rmsg = messages?.[0]
        if (!rmsg?.message || rmsg.key.fromMe || rmsg.key.remoteJid !== from) return
        const text = rmsg.message.conversation || rmsg.message.extendedTextMessage?.text || ''
        const replyTo = rmsg.message?.extendedTextMessage?.contextInfo?.stanzaId

        if (replyTo !== msgId) return

        let response = ''
        switch (text.trim()) {
          case '1':
            AI_STATE.IB = 'true'; AI_STATE.GC = 'false'
            response = '✅ Xylo AI enabled for PM only.'
            break
          case '2':
            AI_STATE.IB = 'false'; AI_STATE.GC = 'true'
            response = '✅ Xylo AI enabled for Groups only.'
            break
          case '3':
            AI_STATE.IB = 'true'; AI_STATE.GC = 'true'
            response = '✅ Xylo AI enabled for All chats.'
            break
          case '4':
            AI_STATE.IB = 'false'; AI_STATE.GC = 'false'
            response = '❌ Xylo AI disabled everywhere.'
            break
          default:
            return Dave.sendMessage(from, {
              text: '❗ Invalid option. Reply with 1, 2, 3 or 4.'
            }, { quoted: rmsg })
        }

        await setConfig("ai_state", JSON.stringify(AI_STATE))
        await Dave.sendMessage(from, { text: response }, { quoted: rmsg })
        Dave.ev.off("messages.upsert", handler)
      }

      Dave.ev.on("messages.upsert", handler)
      setTimeout(() => Dave.ev.off("messages.upsert", handler), 10 * 60 * 1000)
    }
  }
]