import axios from 'axios'

export default [
  {
    name: 'anime',
    description: 'Search for anime details',
    category: 'anime',
    handler: async ({ msg, Dave, from, args }) => {
      if (!args.length) return Dave.sendMessage(from, { text: '🔍 Please provide an anime name.' }, { quoted: msg })

      const query = args.join(' ')
      try {
        const { data } = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`)
        const anime = data.data[0]
        if (!anime) throw new Error()

        const caption = `🎬 *${anime.title}*\n\n📅 Aired: ${anime.aired.string}\n📺 Episodes: ${anime.episodes}\n⭐ Score: ${anime.score}\n📖 Synopsis: ${anime.synopsis.slice(0, 500)}...`
        await Dave.sendMessage(from, {
          image: { url: anime.images.jpg.image_url },
          caption
        }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: '❌ Anime not found.' }, { quoted: msg })
      }
    }
  },

  {
    name: 'animequote',
    description: 'Get a random anime quote',
    category: 'anime',
    handler: async ({ msg, Dave, from }) => {
      try {
        const res = await axios.get('https://animechan.xyz/api/random')
        const { character, anime, quote } = res.data
        await Dave.sendMessage(from, { text: `🗣️ "${quote}"\n\n— *${character}*, ${anime}` }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: '❌ Failed to get quote.' }, { quoted: msg })
      }
    }
  },

  {
    name: 'waifu',
    description: 'Get a random waifu image',
    category: 'anime',
    handler: async ({ msg, Dave, from }) => {
      try {
        const res = await axios.get('https://api.waifu.pics/sfw/waifu')
        await Dave.sendMessage(from, {
          image: { url: res.data.url },
          caption: '💘 Your random waifu'
        }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: '❌ Failed to fetch waifu.' }, { quoted: msg })
      }
    }
  },

  {
    name: 'neko',
    description: 'Get a random neko image',
    category: 'anime',
    handler: async ({ msg, Dave, from }) => {
      try {
        const res = await axios.get('https://nekos.life/api/v2/img/neko')
        await Dave.sendMessage(from, {
          image: { url: res.data.url },
          caption: '🐱 Here is a neko!'
        }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: '❌ Failed to fetch neko.' }, { quoted: msg })
      }
    }
  },

  {
    name: 'foxxgirl',
    description: 'Get a random foxgirl image',
    category: 'anime',
    handler: async ({ msg, Dave, from }) => {
      try {
        const res = await axios.get('https://nekos.life/api/v2/img/fox_girl')
        await Dave.sendMessage(from, {
          image: { url: res.data.url },
          caption: '🦊 Foxgirl incoming!'
        }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: '❌ Failed to fetch foxgirl.' }, { quoted: msg })
      }
    }
  }
]