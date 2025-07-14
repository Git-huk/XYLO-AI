import config from '../config.js'
import { getMediaFromMsg } from '../lib/getMedia.js'

const prefix = config.PREFIX

export default [
  {
    name: 'toimg',
    description: 'Convert sticker/webp to image',
    category: 'media',
    usage: `${prefix}toimg`,
    handler: async ({ msg, Dave, from, reply }) => {
      try {
        const media = await getMediaFromMsg(msg)
        await Dave.sendMessage(from, {
          image: media,
          caption: '🖼️ Converted to image'
        }, { quoted: msg })
      } catch (err) {
        reply(`❌ Failed: ${err.message}`)
      }
    }
  },

  {
    name: 'tomp3',
    description: 'Convert video/audio to MP3',
    category: 'media',
    usage: `${prefix}tomp3`,
    handler: async ({ msg, Dave, from, reply }) => {
      try {
        const media = await getMediaFromMsg(msg)
        await Dave.sendMessage(from, {
          audio: media,
          mimetype: 'audio/mpeg'
        }, { quoted: msg })
      } catch (err) {
        reply(`❌ Failed: ${err.message}`)
      }
    }
  },

  {
    name: 'toaudio',
    description: 'Convert video to audio',
    category: 'media',
    usage: `${prefix}toaudio`,
    handler: async ({ msg, Dave, from, reply }) => {
      try {
        const media = await getMediaFromMsg(msg)
        await Dave.sendMessage(from, {
          audio: media,
          mimetype: 'audio/mpeg'
        }, { quoted: msg })
      } catch (err) {
        reply(`❌ Failed: ${err.message}`)
      }
    }
  },

  {
    name: 'toptt',
    description: 'Convert media to PTT (voice note)',
    category: 'media',
    usage: `${prefix}toptt`,
    handler: async ({ msg, Dave, from, reply }) => {
      try {
        const media = await getMediaFromMsg(msg)
        await Dave.sendMessage(from, {
          audio: media,
          ptt: true,
          mimetype: 'audio/ogg; codecs=opus'
        }, { quoted: msg })
      } catch (err) {
        reply(`❌ Failed: ${err.message}`)
      }
    }
  },

  {
    name: 'tovideo',
    description: 'Convert animated sticker to video',
    category: 'media',
    usage: `${prefix}tovideo`,
    handler: async ({ msg, Dave, from, reply }) => {
      try {
        const media = await getMediaFromMsg(msg)
        await Dave.sendMessage(from, {
          video: media,
          caption: '🎞️ Converted to video.'
        }, { quoted: msg })
      } catch (err) {
        reply(`❌ Failed: ${err.message}`)
      }
    }
  },

  {
    name: 'togif',
    description: 'Convert video/webp to GIF',
    category: 'media',
    usage: `${prefix}togif`,
    handler: async ({ msg, Dave, from, reply }) => {
      try {
        const media = await getMediaFromMsg(msg)
        await Dave.sendMessage(from, {
          video: media,
          gifPlayback: true,
          caption: '🎞️ Converted to GIF.'
        }, { quoted: msg })
      } catch (err) {
        reply(`❌ Failed: ${err.message}`)
      }
    }
  }
]