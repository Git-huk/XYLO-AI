// lib/gameListener.js
import { startGame, handleInput } from './games/wcg.js'
import { startTrivia, handleTriviaAnswer } from './games/trivia.js'
import { startTTT, playTTT, acceptTTT } from './games/ttt.js'
import { getLeaderboard } from './games/stats.js'

// ✅ Fix: Initialize global store for active games
global.activeGames = global.activeGames || {}

export default function setupGameListener(client) {
  client.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || !msg.key || !msg.key.remoteJid) return

    const chatId = msg.key.remoteJid
    const from = msg.key.participant || chatId
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    if (!body) return

    const text = body.trim().toLowerCase()
    const isGroup = chatId.endsWith('@g.us')
    const session = global.activeGames?.[chatId]
    
    // 📊 Leaderboard command
if (text === 'leaderboard') {
  const message = getLeaderboard()
  if (!message.includes('@')) {
    return client.sendMessage(chatId, { text: '📉 No game data yet.' }, { quoted: msg })
  }

  const mentions = [...message.matchAll(/@(\d+)/g)].map(m => m[1] + '@s.whatsapp.net')
  return client.sendMessage(chatId, {
    text: message,
    mentions
  }, { quoted: msg })
}
    // ✅ WCG: Start
    if (isGroup && text === 'wcg') {
      const m = {
        from: chatId,
        sender: from,
        reply: (t) => client.sendMessage(chatId, { text: t }, { quoted: msg })
      }
      return await startGame(client, m)
    }

    // 🔁 WCG: Active
    if (session?.type === 'wcg') {
      return await handleInput(msg, client, session)
    }

    // ✅ TRIVIA: Start
    if (isGroup && text === 'trivia') {
      const m = {
        from: chatId,
        sender: from,
        reply: (t) => client.sendMessage(chatId, { text: t }, { quoted: msg })
      }
      return await startTrivia(client, m)
    }

    // 🔁 TRIVIA: Active
    if (session?.type === 'trivia') {
      return await handleTriviaAnswer(msg, client, session)
    }

    // ✅ TTT: Group Start
    if (isGroup && text.startsWith('ttt')) {
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      if (mentionedJid) return startTTT(client, msg, mentionedJid)
    }

    // ✅ TTT: DM Start
    if (!isGroup && text === 'ttt') {
      return startTTT(client, msg, from, true)
    }

    // ✅ TTT: Accept in group
    if (isGroup && text === 'accept') {
      return acceptTTT(client, msg)
    }

    // ✅ TTT: Play Move
    if (text.match(/^[1-9]$/)) {
      return playTTT(client, msg, text)
    }
  })
}