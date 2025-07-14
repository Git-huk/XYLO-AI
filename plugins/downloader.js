import axios from 'axios'

export default [
  {
    name: 'ytmp3',
    handler: async ({ args, reply, client, m }) => {
      if (!args[0]) return reply('🎧 Enter YouTube link!\n\nExample: .ytmp3 https://youtu.be/xyz')
      try {
        const { data } = await axios.get(`https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(args[0])}`)
        if (!data?.result?.download_url) return reply('❌ Could not fetch MP3.')
        await client.sendMessage(m.from, {
          audio: { url: data.result.download_url },
          mimetype: 'audio/mpeg',
          fileName: `${data.result.title}.mp3`
        }, { quoted: m })
      } catch {
        reply('❌ Error downloading MP3.')
      }
    }
  },
  {
    name: 'ytmp4',
    handler: async ({ args, reply, client, m }) => {
      if (!args[0]) return reply('📹 Enter YouTube link!\n\nExample: .ytmp4 https://youtu.be/xyz')
      try {
        const { data } = await axios.get(`https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(args[0])}`)
        if (!data?.result?.download_url) return reply('❌ Could not fetch MP4.')
        await client.sendMessage(m.from, {
          video: { url: data.result.download_url },
          caption: data.result.title || 'Downloaded video'
        }, { quoted: m })
      } catch {
        reply('❌ Error downloading MP4.')
      }
    }
  },
  {
    name: 'tiktok',
    handler: async ({ args, reply, client, m }) => {
      if (!args[0]) return reply('🎵 Enter TikTok link!')
      try {
        const { data } = await axios.get(`https://apis.davidcyriltech.my.id/download/tiktok?url=${encodeURIComponent(args[0])}`)
        if (!data?.result?.video) return reply('❌ TikTok download failed.')
        await client.sendMessage(m.from, {
          video: { url: data.result.video },
          caption: data.result.desc || 'TikTok video'
        }, { quoted: m })
      } catch {
        reply('❌ Error downloading TikTok.')
      }
    }
  },
  {
    name: 'facebook',
    handler: async ({ args, reply, client, m }) => {
      if (!args[0]) return reply('📘 Enter Facebook video link!')
      try {
        const { data } = await axios.get(`https://apis.davidcyriltech.my.id/facebook3?url=${encodeURIComponent(args[0])}`)
        const url = data?.results?.hdLink || data?.results?.sdLink
        if (!url) return reply('❌ Facebook download failed.')
        await client.sendMessage(m.from, {
          video: { url },
          caption: data.results.caption || 'Facebook video'
        }, { quoted: m })
      } catch {
        reply('❌ Error downloading Facebook video.')
      }
    }
  },
  {
    name: 'instagram',
    handler: async ({ args, reply, client, m }) => {
      if (!args[0]) return reply('📸 Enter Instagram link!')
      try {
        const { data } = await axios.get(`https://apis-keith.vercel.app/download/instadl3?url=${encodeURIComponent(args[0])}`)
        if (!data?.status || !data?.result?.url) return reply('❌ No downloadable IG media.')
        const isVideo = (data.result.type || '').includes('video')
        await client.sendMessage(m.from, {
          [isVideo ? 'video' : 'image']: { url: data.result.url },
          caption: 'Instagram media'
        }, { quoted: m })
      } catch {
        reply('❌ Error downloading Instagram media.')
      }
    }
  }
]