import fs from 'fs'
import path from 'path'
import { getConfig } from './configdb.js'

const TMP_DIR = './tmp'
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR)

/**
 * Handle deleted message
 */
export async function handleDeletedMessage(Dave, msg) {
  const id = msg.key?.id
  const original = global.antideleteStore?.get(id)
  const mode = await getConfig('antidelete_mode') || 'off'
  if (!original || mode === 'off') return

  const sender = original.key?.participant || original.key?.remoteJid
  const isBot = sender === Dave.user.id
  if (isBot) return

  const chat = original.key.remoteJid
  const isGroup = chat.endsWith('@g.us')
  let groupName = ''
  if (isGroup) {
    try {
      const metadata = await Dave.groupMetadata(chat)
      groupName = metadata?.subject || ''
    } catch {
      groupName = 'Group'
    }
  }

  const type = Object.keys(original.message || {})[0]
  const contentText =
    original.message?.conversation ||
    original.message?.extendedTextMessage?.text ||
    original.message?.[type]?.caption ||
    '[Media or File]'

  const time = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Africa/Lagos'
  })

  const captionLines = [
    `🗑 *Deleted ${type === 'stickerMessage' ? 'Sticker' : 'Message'}*`,
    `👤 From: @${sender.split('@')[0]}`,
    isGroup ? `👥 Group: ${groupName}` : null,
    `🕒 Time: ${time}`,
    `📎 Type: ${type}`
  ]

  const target = mode === 'inbox' ? Dave.user.id : chat

  try {
    await Dave.sendMessage(target, {
      text: captionLines.filter(Boolean).join('\n'),
      mentions: [sender]
    })

    // Restore sticker with caption if possible
    if (type === 'stickerMessage') {
      await Dave.sendMessage(target, {
        sticker: original.message.stickerMessage,
        contextInfo: { mentionedJid: [sender] }
      })
    } else {
      // Relay full message
      await Dave.relayMessage(target, original.message, {})

      // Also restore quoted message if available
      const quoted = original.message?.extendedTextMessage?.contextInfo?.quotedMessage
      if (quoted) {
        await Dave.relayMessage(target, quoted, {})
      }
    }

    // Clean temp files
    fs.readdirSync(TMP_DIR).forEach(file => {
      const filepath = path.join(TMP_DIR, file)
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
    })

    console.log(`♻️ Restored deleted ${type} from ${sender}`)
  } catch (err) {
    console.error('❌ Failed to resend deleted message:', err.message)
  }

  global.antideleteStore.delete(id)
}