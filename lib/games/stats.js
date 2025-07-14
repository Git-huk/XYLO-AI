import fs from 'fs'
const statsPath = './lib/games/gameStats.json'

function loadStats() {
  if (!fs.existsSync(statsPath)) fs.writeFileSync(statsPath, '{}')
  return JSON.parse(fs.readFileSync(statsPath))
}

function saveStats(data) {
  fs.writeFileSync(statsPath, JSON.stringify(data, null, 2))
}

export function addWin(userId, gameType) {
  const stats = loadStats()
  if (!stats[userId]) stats[userId] = { ttt: 0, wcg: 0, trivia: 0 }
  stats[userId][gameType]++
  saveStats(stats)
}

export function getLeaderboard() {
  const stats = loadStats()
  const sorted = Object.entries(stats)
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => (b.ttt + b.wcg + b.trivia) - (a.ttt + a.wcg + a.trivia))

  const lines = ['🏅 *Game Leaderboard*\n']
  for (const user of sorted.slice(0, 10)) {
    const total = (user.ttt || 0) + (user.wcg || 0) + (user.trivia || 0)
    if (total === 0) continue

    let line = `@${user.id.split('@')[0]} — 🏆 *${total}* wins`

    const parts = []
    if (user.trivia) parts.push(`🧠 ${user.trivia}`)
    if (user.wcg) parts.push(`🔤 ${user.wcg}`)
    if (user.ttt) parts.push(`❌⭕ ${user.ttt}`)

    if (parts.length) line += ` (${parts.join(' | ')})`
    lines.push(line)
  }

  return lines.join('\n')
}