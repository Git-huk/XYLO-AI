// lib/getLinkMode.js
import fs from 'fs'
const groupPath = './lib/group.json'

export function getLinkDetectionMode(groupId) {
  const db = fs.existsSync(groupPath)
    ? JSON.parse(fs.readFileSync(groupPath, 'utf-8'))
    : {}
  return db[groupId]?.antilinkMode || 'off'
}