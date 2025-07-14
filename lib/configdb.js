import fs from 'fs'

const file = './lib/configdb.json'

// Load config JSON from file
function loadConfig() {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : { config: {} }
}

// Save config JSON to file
function saveConfig(db) {
  fs.writeFileSync(file, JSON.stringify(db, null, 2))
}

// Get specific key from config
export async function getConfig(key) {
  const db = loadConfig()
  return db.config?.[key]
}

// Set specific key in config
export async function setConfig(key, value) {
  const db = loadConfig()
  if (!db.config) db.config = {}
  db.config[key] = value
  saveConfig(db)
}