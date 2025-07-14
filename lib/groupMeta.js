import { isJidGroup } from 'baileys'
import fs from 'fs/promises'
import path from 'path'

const storeDir = path.resolve('./store')
const ensureStoreDir = async () => {
  try {
    await fs.mkdir(storeDir, { recursive: true })
  } catch {}
}

const readJSON = async (file) => {
  try {
    const data = await fs.readFile(path.join(storeDir, file), 'utf8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

const writeJSON = async (file, data) => {
  await ensureStoreDir()
  await fs.writeFile(path.join(storeDir, file), JSON.stringify(data, null, 2))
}

export async function saveGroupMetadata(jid, client) {
  if (!isJidGroup(jid)) return
  try {
    const groupMetadata = await client.groupMetadata(jid)
    const metadata = {
      jid: groupMetadata.id,
      subject: groupMetadata.subject,
      size: groupMetadata.size,
      creation: groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toISOString() : null,
      owner: groupMetadata.owner,
      desc: groupMetadata.desc,
      restrict: groupMetadata.restrict,
      announce: groupMetadata.announce,
      ephemeralDuration: groupMetadata.ephemeralDuration
    }

    const metadataList = await readJSON('group_metadata.json')
    const idx = metadataList.findIndex((m) => m.jid === jid)
    if (idx > -1) metadataList[idx] = metadata
    else metadataList.push(metadata)
    await writeJSON('group_metadata.json', metadataList)

    const participants = groupMetadata.participants.map(p => ({
      jid: p.id,
      admin: p.admin
    }))
    await writeJSON(`${jid}_participants.json`, participants)
  } catch (e) {
    console.warn(`⚠️ Failed to save metadata for ${jid}:`, e.message)
  }
}

export async function getGroupMetadata(jid) {
  if (!isJidGroup(jid)) return null
  const metadataList = await readJSON('group_metadata.json')
  const meta = metadataList.find((m) => m.jid === jid)
  if (!meta) return null

  const participants = await readJSON(`${jid}_participants.json`)
  return { ...meta, participants }
}

export async function isAdmin(jid, userId) {
  const metadata = await getGroupMetadata(jid)
  return metadata?.participants?.some(p => p.jid === userId && p.admin) || false
}

export async function isBotAdmin(jid, botId) {
  const metadata = await getGroupMetadata(jid)
  if (!metadata || !metadata.participants) return false

  const cleanId = botId?.split(':')[0] + '@s.whatsapp.net'
  return metadata.participants.some(p => p.jid === cleanId && p.admin)
}