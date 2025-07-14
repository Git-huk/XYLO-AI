// lib/games/trivia.js
import axios from 'axios'
import { addWin } from './stats.js'

const JOIN_DURATION = 60000
const ANSWER_TIME = 20000
const MIN_PLAYERS = 2
global.triviaTimers = {}

function formatName(id) {
  return '@' + id.split('@')[0]
}

export async function startTrivia(Dave, m) {
  const chatId = m.from
  if (global.activeGames[chatId]) return m.reply('⚠️ A game is already running.')

  global.activeGames[chatId] = {
    type: 'trivia',
    status: 'waiting',
    players: [],
    currentQ: null,
    currentAns: '',
    round: 1
  }

  m.reply(`🧠 *Trivia Challenge Starting!*\nType *join* to participate.\n⏳ Starting in 60 seconds...`)

  setTimeout(() => {
    const session = global.activeGames[chatId]
    if (!session || session.players.length < MIN_PLAYERS) {
      delete global.activeGames[chatId]
      return m.reply('❌ Not enough players joined. Trivia cancelled.')
    }
    beginTrivia(Dave, chatId)
  }, JOIN_DURATION)
}

async function beginTrivia(Dave, chatId) {
  const session = global.activeGames[chatId]
  if (!session) return

  session.status = 'playing'
  session.round = 1
  await askQuestion(Dave, chatId)
}

async function askQuestion(Dave, chatId) {
  const session = global.activeGames[chatId]
  if (!session) return

  const { question, correct_answer, incorrect_answers } = await getTrivia()
  const options = shuffle([...incorrect_answers, correct_answer])
  const letters = ['A', 'B', 'C', 'D']
  const answerMap = {}
  options.forEach((opt, i) => (answerMap[letters[i]] = opt))

  const correctLetter = Object.keys(answerMap).find(key => answerMap[key] === correct_answer)

  session.currentQ = question
  session.currentAns = correctLetter.toLowerCase()
  session.answerMap = answerMap

  let qText = `🧠 *Trivia Round ${session.round}*\n${decodeHTMLEntities(question)}\n\n`
  for (const [key, val] of Object.entries(answerMap)) {
    qText += `*${key}.* ${decodeHTMLEntities(val)}\n`
  }
  qText += `\n📝 Answer with: a / b / c / d\n⏱️ You have ${ANSWER_TIME / 1000} seconds!`

  Dave.sendMessage(chatId, { text: qText })

  global.triviaTimers[chatId] = setTimeout(() => {
    Dave.sendMessage(chatId, { text: '⏳ Time is up! Eliminating non-responders...' })
    eliminateAll(Dave, chatId, null) // eliminate everyone
  }, ANSWER_TIME)
}

export async function handleTriviaAnswer(msg, Dave, session) {
  const chatId = msg.key.remoteJid
  const userId = msg.key.participant || msg.key.remoteJid
  const body = msg.message?.conversation?.trim().toLowerCase()

  if (session.status === 'waiting' && body === 'join' && !session.players.includes(userId)) {
    session.players.push(userId)
    return Dave.sendMessage(chatId, { text: `✅ ${formatName(userId)} joined! (${session.players.length})` }, { quoted: msg })
  }

  if (session.status !== 'playing') return
  if (!['a', 'b', 'c', 'd'].includes(body)) return
  if (!session.players.includes(userId)) return

  clearTimeout(global.triviaTimers[chatId])

  const isCorrect = body === session.currentAns
  if (!isCorrect) {
    session.players = session.players.filter(p => p !== userId)
    await Dave.sendMessage(chatId, { text: `❌ ${formatName(userId)} got it wrong! Eliminated.` }, { quoted: msg })
  } else {
    await Dave.sendMessage(chatId, { text: `✅ ${formatName(userId)} answered correctly!` }, { quoted: msg })
  }

  if (session.players.length < 2) {
    const winner = session.players[0]
    await declareTriviaWinner(Dave, chatId, winner, session)
  } else {
    session.round++
    askQuestion(Dave, chatId)
  }
}

async function declareTriviaWinner(Dave, chatId, winner, session) {
  delete global.activeGames[chatId]
  clearTimeout(global.triviaTimers[chatId])
  if (winner !== 'none') addWin(winner, 'trivia')

  const msg = `🏁 *Trivia Over!*\n🏆 Winner: @${winner.split('@')[0]}\n🔁 Rounds Played: ${session.round}`
  Dave.sendMessage(chatId, { text: msg, mentions: [winner] })
}

function decodeHTMLEntities(str) {
  return str.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&')
}

async function getTrivia() {
  try {
    const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple')
    return res.data.results[0]
  } catch {
    return {
      question: 'Failed to fetch question.',
      correct_answer: 'None',
      incorrect_answers: ['None', 'None', 'None']
    }
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function eliminateAll(Dave, chatId, msg) {
  const session = global.activeGames[chatId]
  if (!session) return
  session.players = []
  declareTriviaWinner(Dave, chatId, 'none', session)
}