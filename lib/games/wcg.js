// lib/games/wcg.js
import axios from 'axios'
import { addWin } from './stats.js'

const wcgSessions = {}
const MIN_PLAYERS = 2
const JOIN_DURATION = 60_000 // 60s for players to join
const BASE_TIME = 40 // seconds per turn, gets shorter
const BASE_LENGTH = 4 // base word length, increases each round

global.wcgTimers = {}

function formatName(id) {
  return '@' + id.split('@')[0]
}

export async function startGame(Dave, m) {
  const chatId = m.from
  if (global.activeGames[chatId]) return m.reply('⚠️ A game is already running in this group.')

  global.activeGames[chatId] = {
    type: 'wcg',
    status: 'waiting',
    players: [],
    usedWords: [],
    round: 1,
    lastChar: '',
    turnIndex: 0,
    message: m,
    startedBy: m.sender
  }

  m.reply(`🎮 *Word Chain Game Starting!*\nType *join* to participate!\n⏳ Starting in 60 seconds...`)

  wcgSessions[chatId] = setTimeout(() => {
    const session = global.activeGames[chatId]
    if (!session || session.players.length < MIN_PLAYERS) {
      delete global.activeGames[chatId]
      return m.reply('❌ Game cancelled. Not enough players joined.')
    }
    beginRound(Dave, chatId)
  }, JOIN_DURATION)
}

export async function handleInput(msg, Dave, session) {
  const chatId = msg.key.remoteJid
  const userId = msg.key.participant || msg.key.remoteJid
  const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
  const word = body.trim().toLowerCase()

  if (session.status === 'waiting') {
    if (word === 'join' && !session.players.includes(userId)) {
      session.players.push(userId)
      return Dave.sendMessage(chatId, { text: `✅ ${formatName(userId)} joined! (${session.players.length} players)` }, { quoted: msg })
    }
    return
  }

  // Only current player can respond
  const current = session.players[session.turnIndex]
  if (userId !== current) return

  if (word.length < session.minLength) {
    return Dave.sendMessage(chatId, { text: `❌ Word must be at least *${session.minLength} letters*.` }, { quoted: msg })
  }

  if (session.usedWords.includes(word)) {
    return Dave.sendMessage(chatId, { text: '🚫 That word has already been used!' }, { quoted: msg })
  }

  if (session.lastChar && word[0] !== session.lastChar) {
    return Dave.sendMessage(chatId, { text: `🔠 Word must start with *${session.lastChar.toUpperCase()}*` }, { quoted: msg })
  }

  const isValid = await checkWord(word)
  if (!isValid) {
    return Dave.sendMessage(chatId, { text: `❌ "${word}" is not a valid English word.` }, { quoted: msg })
  }

  clearTimeout(global.wcgTimers[chatId])
  session.usedWords.push(word)
  session.lastChar = word.slice(-1)
  session.turnIndex++
  session.round++
  session.minLength++
  session.timeLimit = Math.max(5, BASE_TIME - Math.floor(session.round / 3))

  if (session.players.length === 1) {
    const winner = session.players[0]
    if (winner) await declareWinner(Dave, chatId, winner, word, session)
    return
  }

  nextTurn(Dave, chatId)
}

function nextTurn(Dave, chatId) {
  const session = global.activeGames[chatId]
  if (!session) return

  if (session.turnIndex >= session.players.length) {
    session.turnIndex = 0
  }

  const current = session.players[session.turnIndex]
  session.minLength = BASE_LENGTH + Math.floor(session.round / 3)
  const message = `🎯 Round ${session.round}\n` +
    `@${current.split('@')[0]}, your word must start with *${session.lastChar.toUpperCase()}* and be *${session.minLength}+ letters*\n` +
    `⏱️ You have *${session.timeLimit}s*...`

  Dave.sendMessage(chatId, {
    text: message,
    mentions: [current]
  })

  global.wcgTimers[chatId] = setTimeout(() => {
    Dave.sendMessage(chatId, { text: `⏳ ${formatName(current)} took too long! Eliminated.` })
    session.players.splice(session.turnIndex, 1)
    if (session.players.length < 2) {
      const winner = session.players[0]
      if (winner) declareWinner(Dave, chatId, winner, 'N/A', session)
    } else {
      nextTurn(Dave, chatId)
    }
  }, session.timeLimit * 1000)
}

async function beginRound(Dave, chatId) {
  const session = global.activeGames[chatId]
  if (!session) return

  session.status = 'playing'
  session.lastChar = randomLetter()
  session.minLength = BASE_LENGTH
  session.timeLimit = BASE_TIME

  await Dave.sendMessage(chatId, {
    text: `🎮 Game started with ${session.players.length} players!\n🔤 First letter: *${session.lastChar.toUpperCase()}*`
  })

  nextTurn(Dave, chatId)
}

async function declareWinner(Dave, chatId, winnerId, finalWord, session) {
  delete global.activeGames[chatId]
  clearTimeout(global.wcgTimers[chatId])
  if (winnerId) addWin(winnerId, 'wcg')

  const winnerTag = winnerId?.includes('@') ? '@' + winnerId.split('@')[0] : 'Unknown'

  const msg = `🏁 *Game Over!*\n` +
              `🏆 Winner: ${winnerTag}\n` +
              `🔠 Last Word: ${finalWord}\n` +
              `🔁 Rounds Played: ${session.round}`

  await Dave.sendMessage(chatId, {
    text: msg,
    mentions: [winnerId]
  })
}

function randomLetter() {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  return chars[Math.floor(Math.random() * chars.length)]
}

async function checkWord(word) {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    const res = await axios.get(url)
    return Array.isArray(res.data)
  } catch {
    return false
  }
}