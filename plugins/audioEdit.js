// 📁 plugins/audioEffects.js
import { getContentType, downloadContentFromMessage } from 'baileys'
import audioEditor from '../data/audioeditor.js'
import config from '../config.js'

const prefix = config.PREFIX

const effects = [
  'deep', 'smooth', 'fat', 'tupai', 'blown', 'radio', 'robot', 'chipmunk',
  'nightcore', 'earrape', 'bass', 'reverse', 'slow', 'fast', 'baby', 'deamon'
]

export default effects.map(name => ({
  name,
  description: `Apply ${name} effect to audio/video`,
  category: 'audio',
  use: `${prefix}${name} (reply to audio/video)`,
  handler: async ({ msg, Dave, from }) => {
    await handleAudioEffect(name, msg, Dave, from)
  }
}))

async function handleAudioEffect(effect, msg, Dave, from) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  if (!quoted) {
    return await Dave.sendMessage(from, {
      text: '*🎧 Reply to an audio or video message to apply effect.*'
    }, { quoted: msg })
  }

  const qType = getContentType(quoted)
  if (!['audioMessage', 'videoMessage'].includes(qType)) {
    return await Dave.sendMessage(from, {
      text: '*🎧 Replied message is not an audio or video.*'
    }, { quoted: msg })
  }

  await Dave.sendMessage(from, { react: { text: '🎛️', key: msg.key } })

  try {
    const stream = await downloadContentFromMessage(
      quoted[qType],
      qType.includes('audio') ? 'audio' : 'video'
    )
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)

    const ext = qType === 'videoMessage' ? 'mp4' : 'mp3'
    const output = await audioEditor[effect](buffer, ext)

    await Dave.sendMessage(from, {
      audio: output,
      mimetype: 'audio/mpeg'
    }, { quoted: msg })

    await Dave.sendMessage(from, { react: { text: '✅', key: msg.key } })
  } catch (err) {
    console.error(`🎧 Audio effect failed:`, err)
    await Dave.sendMessage(from, {
      text: '❌ Failed to apply audio effect.'
    }, { quoted: msg })
    await Dave.sendMessage(from, { react: { text: '❌', key: msg.key } })
  }
}