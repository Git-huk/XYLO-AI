// lib/getMedia.js
import { getContentType, downloadContentFromMessage } from 'baileys'

export async function getMediaFromMsg(msg) {
  // The message object where the media should be
  let targetMsg = null

  // 1. Try quoted message from `msg.quoted.message`
  if (msg.quoted?.message) {
    targetMsg = msg.quoted.message
  }
  // 2. Sometimes quoted message is inside extendedTextMessage.contextInfo.quotedMessage
  else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
    targetMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage
  }
  // 3. Otherwise, use msg.message itself (media sent directly)
  else if (msg.message) {
    targetMsg = msg.message
  } else {
    throw new Error('No media message found to download')
  }

  // Detect media type (imageMessage, videoMessage, etc)
  const mediaType = getContentType(targetMsg)

  if (!['audioMessage', 'videoMessage', 'stickerMessage', 'imageMessage'].includes(mediaType)) {
    throw new Error('Unsupported or missing media. Supported types: audio, video, sticker, image')
  }

  const stream = await downloadContentFromMessage(targetMsg[mediaType], mediaType.replace('Message', ''))

  let buffer = Buffer.from([])
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

  if (!buffer.length) throw new Error('Media buffer is empty')

  return buffer
}