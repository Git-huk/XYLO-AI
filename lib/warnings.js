// lib/warnings.js
import fs from 'fs'
const warnPath = './lib/warn.json'

function load() {
  return fs.existsSync(warnPath)
    ? JSON.parse(fs.readFileSync(warnPath, 'utf-8'))
    : {}
}
function save(data) {
  fs.writeFileSync(warnPath, JSON.stringify(data, null, 2))
}

export function incrementWarning(groupId, jid) {
  const db = load()
  db[groupId] = db[groupId] || {}
  db[groupId][jid] = (db[groupId][jid] || 0) + 1
  save(db)
  return db[groupId][jid]
}

export function resetWarning(groupId, jid) {
  const db = load()
  if (db[groupId]) db[groupId][jid] = 0
  save(db)
}