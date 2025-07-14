import { addWin } from './stats.js'

const tttSessions = {}
const emojiMap = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣']
const cleanJid = (jid) => jid?.split('@')[0] + '@s.whatsapp.net'

function renderBoard(board) {
  return [
    '┄┄┄┄┄┄┄┄┄┄┄',
    `┃ ${board[0]} ┃ ${board[1]} ┃ ${board[2]} ┃`,
    '┄┄┄┄┄┄┄┄┄┄┄',
    `┃ ${board[3]} ┃ ${board[4]} ┃ ${board[5]} ┃`,
    '┄┄┄┄┄┄┄┄┄┄┄',
    `┃ ${board[6]} ┃ ${board[7]} ┃ ${board[8]} ┃`,
    '┄┄┄┄┄┄┄┄┄┄'
  ].join('\n')
}

function checkWin(b, p) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ]
  return wins.some(([a,b_,c]) => b[a] === p && b[b_] === p && b[c] === p)
}

export function startTTT(Dave, msg, opponentId, isDM = false) {
  const chatId = msg.key.remoteJid
  const from = msg.key.participant || chatId
  const botId = Dave?.user?.id

  if (tttSessions[chatId]) {
    return Dave.sendMessage(chatId, { text: '⚠️ A TTT game is already running here.' })
  }

  if (!isDM && (!opponentId || opponentId === from) && opponentId !== botId) {
    return Dave.sendMessage(chatId, { text: '❌ You cannot play with yourself. Tag someone else or use `ttt @xylo` to challenge the bot.' })
  }

  const isBotOpponent = opponentId === botId
  const playerX = from
  const playerO = isBotOpponent ? botId : opponentId
  const board = [...emojiMap]
  const turn = Math.random() < 0.5 ? 'X' : 'O'

  tttSessions[chatId] = {
    board,
    turn,
    players: {
      X: turn === 'X' ? playerX : playerO,
      O: turn === 'O' ? playerX : playerO
    },
    isBot: isBotOpponent,
    waiting: !isDM && !isBotOpponent,
    waitTimeout: null
  }

  const autoStart = isDM || isBotOpponent
  const challengeMsg = autoStart
    ? `🎮 *Tic Tac Toe Started!*\n${renderBoard(board)}\n\n❌: @${cleanJid(tttSessions[chatId].players.X).split('@')[0]}\n⭕: @${cleanJid(tttSessions[chatId].players.O).split('@')[0]}\n👉 @${cleanJid(tttSessions[chatId].players[turn]).split('@')[0]}'s turn`
    : `🎯 *Tic Tac Toe Challenge!*\n@${cleanJid(playerO).split('@')[0]}, type *accept* to begin.`

  Dave.sendMessage(chatId, {
    text: challengeMsg,
    mentions: autoStart ? [cleanJid(playerX), cleanJid(playerO)] : [cleanJid(playerO)]
  })

  if (!autoStart) {
    tttSessions[chatId].waitTimeout = setTimeout(() => {
      if (tttSessions[chatId]?.waiting) {
        delete tttSessions[chatId]
        Dave.sendMessage(chatId, { text: '⌛ Game canceled. No response from opponent.' })
      }
    }, 30_000)
  }

  if (isBotOpponent && tttSessions[chatId].players[turn] === botId) {
    setTimeout(() => botAutoPlay(Dave, chatId), 1500)
  }
}

export function acceptTTT(Dave, msg) {
  const chatId = msg.key.remoteJid
  const from = msg.key.participant || chatId
  const game = tttSessions[chatId]
  if (!game || !game.waiting) return

  if (!Object.values(game.players).includes(from)) {
    return Dave.sendMessage(chatId, { text: '❌ You are not part of this challenge.' })
  }

  game.waiting = false
  clearTimeout(game.waitTimeout)

  Dave.sendMessage(chatId, {
    text: `🎮 *Game Started!*\n${renderBoard(game.board)}\n\n❌: @${cleanJid(game.players.X).split('@')[0]}\n⭕: @${cleanJid(game.players.O).split('@')[0]}\n👉 @${cleanJid(game.players[game.turn]).split('@')[0]}'s turn`,
    mentions: [cleanJid(game.players.X), cleanJid(game.players.O)]
  })

  if (game.isBot && game.players[game.turn] === Dave.user.id) {
    setTimeout(() => botAutoPlay(Dave, chatId), 1500)
  }
}

export function playTTT(Dave, msg, text) {
  const chatId = msg.key.remoteJid
  const from = msg.key.participant || chatId
  const game = tttSessions[chatId]
  if (!game) return

  const { board, turn, players } = game
  if (players[turn] !== from) return

  const pos = parseInt(text) - 1
  if (isNaN(pos) || pos < 0 || pos > 8 || board[pos] === '❌' || board[pos] === '⭕') {
    return Dave.sendMessage(chatId, { text: '🚫 Invalid or occupied cell!' })
  }

  board[pos] = turn === 'X' ? '❌' : '⭕'

  if (checkWin(board, board[pos])) {
    addWin(from, 'ttt')
    Dave.sendMessage(chatId, {
      text: `🏁 *Game Over!*\n🏆 Winner: @${cleanJid(from).split('@')[0]}\n\n${renderBoard(board)}`,
      mentions: [cleanJid(from)]
    })
    delete tttSessions[chatId]
    return
  }

  const isDraw = board.every(c => c === '❌' || c === '⭕')
  if (isDraw) {
    Dave.sendMessage(chatId, {
      text: `🤝 *It's a Draw!*\n\n${renderBoard(board)}`
    })
    delete tttSessions[chatId]
    return
  }

  game.turn = turn === 'X' ? 'O' : 'X'
  const next = cleanJid(game.players[game.turn])

  Dave.sendMessage(chatId, {
    text: `${renderBoard(board)}\n\n👉 @${next.split('@')[0]}'s turn`,
    mentions: [next]
  })

  if (game.isBot && game.players[game.turn] === Dave.user.id) {
    setTimeout(() => botAutoPlay(Dave, chatId), 1500)
  }
}

function botAutoPlay(Dave, chatId) {
  const game = tttSessions[chatId]
  if (!game) return

  const { board, turn } = game
  const botId = Dave.user.id
  if (game.players[turn] !== botId) return

  const empty = board.map((v, i) => (v !== '❌' && v !== '⭕' ? i : null)).filter(v => v !== null)
  const pos = empty[Math.floor(Math.random() * empty.length)]

  const msg = {
    key: { remoteJid: chatId, fromMe: true },
    message: { conversation: (pos + 1).toString() }
  }

  playTTT(Dave, msg, (pos + 1).toString())
}