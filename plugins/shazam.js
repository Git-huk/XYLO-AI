import crypto from 'crypto'
import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import ffmpegPath from 'ffmpeg-static'
import { execFile } from 'child_process'
import util from 'util'

const execPromise = util.promisify(execFile)

const ACR_CONFIG = {
  host: 'identify-eu-west-1.acrcloud.com',
  access_key: '352b9d6f21439f09c5aadba3386a03cf',
  access_secret: 'zT9Zeg1wSa7HNOTggW4rAGcN2nmIfien5SJx0WPN'
}

const FALLBACK_IMAGE = 'https://i.postimg.cc/rFV2pJW5/IMG-20250603-WA0017.jpg'

function getQuotedMedia(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo
  const quoted = ctx?.quotedMessage
  if (!quoted) return null

  const type = Object.keys(quoted)[0]
  if (type !== 'audioMessage' && type !== 'videoMessage') return null
  return { message: quoted, type }
}

export default [
  {
    name: 'shazam',
    category: 'tools',
    desc: 'Identify music from audio or video',
    async handler({ m, from, reply, Dave }) {
      const quoted = getQuotedMedia(m)
      if (!quoted) return reply('🎵 *Reply to an audio or video to identify the song.*')

      const buffer = await Dave.downloadMediaMessage({ message: quoted.message }, 'buffer')
      const id = Date.now()
      const inputPath = path.join('/tmp', `shz_${id}_input.mp3`)
      const trimPath = path.join('/tmp', `shz_${id}_trimmed.mp3`)
      fs.writeFileSync(inputPath, buffer)

      // Trim to 20 sec max
      try {
        await execPromise(ffmpegPath, ['-y', '-i', inputPath, '-t', '20', '-acodec', 'copy', trimPath])
      } catch (e) {
        fs.copyFileSync(inputPath, trimPath)
      }

      const timestamp = Math.floor(Date.now() / 1000)
      const stringToSign = [
        'POST',
        '/v1/identify',
        ACR_CONFIG.access_key,
        'audio',
        '1',
        timestamp
      ].join('\n')

      const signature = crypto
        .createHmac('sha1', ACR_CONFIG.access_secret)
        .update(stringToSign)
        .digest('base64')

      const form = new FormData()
      form.append('access_key', ACR_CONFIG.access_key)
      form.append('sample_bytes', fs.statSync(trimPath).size)
      form.append('sample', fs.createReadStream(trimPath), {
        filename: 'sample.mp3',
        contentType: 'audio/mpeg'
      })
      form.append('timestamp', timestamp)
      form.append('signature', signature)
      form.append('data_type', 'audio')
      form.append('signature_version', '1')

      try {
        const { data } = await axios.post(
          `https://${ACR_CONFIG.host}/v1/identify`,
          form,
          { headers: form.getHeaders() }
        )

        if (data.status.code !== 0 || !data.metadata?.music?.length) {
          return reply(`❌ *Could not identify the song.*\n📛 Reason: ${data.status.msg || 'No match'}`)
        }

        const song = data.metadata.music[0]
        const title = song.title
        const artist = song.artists?.map(a => a.name).join(', ') || 'Unknown'
        const album = song.album?.name || 'Unknown'
        const release = song.release_date || 'Unknown'
        const label = song.label || 'Unknown'

        const spotify = `https://open.spotify.com/search/${encodeURIComponent(title + ' ' + artist)}`
        const youtube = song.external_metadata?.youtube?.vid
          ? `https://youtu.be/${song.external_metadata.youtube.vid}`
          : `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' ' + artist)}`
        const cover = song.album?.images?.[0]?.url || FALLBACK_IMAGE

        const caption = `🎶 *Song Identified*\n\n` +
          `• *Title:* ${title}\n` +
          `• *Artist:* ${artist}\n` +
          `• *Album:* ${album}\n` +
          `• *Release:* ${release}\n` +
          `• *Label:* ${label}\n\n` +
          `🌐 Spotify: ${spotify}\n📺 YouTube: ${youtube}`

        const imageBuffer = (await axios.get(cover, { responseType: 'arraybuffer' })).data

        await Dave.sendMessage(from, {
          image: imageBuffer,
          caption
        }, { quoted: m })

      } catch (err) {
        console.error('[Shazam Error]', err)
        reply('❌ Error while identifying the song.')
      } finally {
        fs.existsSync(inputPath) && fs.unlinkSync(inputPath)
        fs.existsSync(trimPath) && fs.unlinkSync(trimPath)
      }
    }
  }
]