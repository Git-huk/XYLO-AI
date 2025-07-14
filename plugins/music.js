import fetch from 'node-fetch'
import yts from 'yt-search'
import config from '../config.js'

const prefix = config.PREFIX
const tempCache = new Map()

export default [
  {
    name: 'music',
    description: 'Download YouTube song',
    category: 'download',
    usage: `${prefix}music <song name or YouTube link>`,
    handler: async ({ msg, Dave, from, args }) => {
      try {
        if (!args.length) return Dave.sendMessage(from, { text: '🎵 Please provide a song name or YouTube link.' }, { quoted: msg })

        const query = args.join(' ')
        const searchResult = await yts(query)

        if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
          return Dave.sendMessage(from, { text: '❌ No results found!' }, { quoted: msg })
        }

        const song = searchResult.videos[0]
        const cacheKey = `song:${song.title.toLowerCase()}`

        let downloadUrl = null

        if (tempCache.has(cacheKey)) {
          downloadUrl = tempCache.get(cacheKey)
        } else {
          const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(song.url)}`
          const res = await fetch(apiUrl)
          const data = await res.json()

          if (!data?.result?.download_url) {
            return Dave.sendMessage(from, { text: '⛔ Download failed.' }, { quoted: msg })
          }

          downloadUrl = data.result.download_url
          tempCache.set(cacheKey, downloadUrl)
          // Auto-clear cache after 10 minutes (optional)
          setTimeout(() => tempCache.delete(cacheKey), 10 * 60 * 1000)
        }

        const caption = `*MUSIC DOWNLOADER*
╭───────────────◆
│⿻ *Title:* ${song.title}
│⿻ *Quality:* mp3/audio (128kbps)
│⿻ *Duration:* ${song.timestamp}
│⿻ *Views:* ${song.views}
│⿻ *Uploaded:* ${song.ago}
│⿻ *Author:* ${song.author.name}
╰────────────────◆
⦿ *Direct Yt Link:* ${song.url}

Reply with:
*1* To Download Audio 🎶
*2* To Download Audio Document 📄

╭────────────────◆
│ *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠɪᴅx*
╰─────────────────◆`

        const sentMsg = await Dave.sendMessage(from, {
          image: { url: song.thumbnail },
          caption
        }, { quoted: msg })

        const messageID = sentMsg.key.id

        const handler = async (update) => {
          try {
            const message = update.messages[0]
            if (!message?.message || !message.key?.remoteJid) return

            const quotedMsg = message.message?.extendedTextMessage?.contextInfo
            const quotedId = quotedMsg?.stanzaId

            if (quotedId !== messageID) return // Only reply to this message

            const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
            if (text.trim() === '1') {
              await Dave.sendMessage(from, {
                audio: { url: downloadUrl },
                mimetype: 'audio/mpeg',
                ptt: false
              }, { quoted: message })
            } else if (text.trim() === '2') {
              await Dave.sendMessage(from, {
                document: { url: downloadUrl },
                mimetype: 'audio/mpeg',
                fileName: `${song.title}.mp3`
              }, { quoted: message })
            } else {
              await Dave.sendMessage(from, { text: '❌ Invalid option. Reply with 1 or 2.' }, { quoted: message })
            }

            Dave.ev.off('messages.upsert', handler)
          } catch (e) {
            // Silently ignore errors here or you can log
          }
        }

        Dave.ev.on('messages.upsert', handler)
        setTimeout(() => Dave.ev.off('messages.upsert', handler), 10 * 60 * 1000) // 10 minutes timeout

      } catch (e) {
        await Dave.sendMessage(from, { text: '🚫 An error occurred.' }, { quoted: msg })
      }
    }
  }
]