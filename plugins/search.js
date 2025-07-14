import axios from 'axios'
import ytSearch from 'yt-search'
import lyricsFinder from 'lyrics-finder'
import fetch from 'node-fetch'
import config from '../config.js'

const prefix = config.PREFIX

export default [
  // DEFINE
  {
    name: 'define',
    description: 'Get dictionary definition of a word',
    category: 'search',
    handler: async ({ msg, Dave, from, args }) => {
      const word = args.join(' ')
      if (!word) return Dave.sendMessage(from, { text: `Use: ${prefix}define <word>` }, { quoted: msg })

      try {
        const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        const meaning = data[0].meanings[0]
        const defs = meaning.definitions.map((d, i) => `${i + 1}. ${d.definition}`).join('\n')
        await Dave.sendMessage(from, { text: `*${data[0].word}* (${meaning.partOfSpeech})\n\n${defs}` }, { quoted: msg })
      } catch {
        Dave.sendMessage(from, { text: `❌ No definition found.` }, { quoted: msg })
      }
    }
  },
  
  //TIKTOKSEARCH

{
  name: 'tiksearch',
  description: 'Search TikTok videos using keywords',
  category: 'search',
  handler: async ({ msg, Dave, from, args, reply, prefix }) => {
    const query = args.join(' ')
    if (!query) return reply(`❗ Usage: ${prefix}tiksearch <query>\n\nExample: ${prefix}tiksearch cat videos`)

    await reply(`🔍 Searching TikTok for: *${query}*...`)

    try {
      const res = await fetch(`https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(query)}`)
      const data = await res.json()

      if (!data?.data?.length) {
        return reply('❌ No results found. Try a different keyword.')
      }

      const results = data.data.slice(0, 3)

      for (const video of results) {
        const caption = `🎥 *TikTok Result:*\n\n` +
          `• *Title:* ${video.title}\n` +
          `• *Author:* ${video.author || 'Unknown'}\n` +
          `• *Duration:* ${video.duration || 'Unknown'}`

        if (video.nowm) {
          await Dave.sendMessage(from, {
            video: { url: video.nowm },
            caption
          }, { quoted: msg })
        } else {
          await reply(`⚠️ Couldn't load video for *${video.title}*`)
        }
      }
    } catch (e) {
      console.error('❌ TikTok Search Error:', e)
      await reply('❌ Error occurred while searching TikTok.')
    }
  }
},
  // YTSEARCH
  {
    name: 'ytsearch',
    description: 'Search YouTube videos',
    category: 'search',
    handler: async ({ msg, Dave, from, args }) => {
      const query = args.join(' ')
      if (!query) return Dave.sendMessage(from, { text: `Use: ${prefix}ytsearch <keywords>` }, { quoted: msg })

      try {
        const r = await ytSearch(query)
        const videos = r.videos.slice(0, 5)
        if (videos.length === 0) return Dave.sendMessage(from, { text: '❌ No videos found.' }, { quoted: msg })

        const list = videos.map((v, i) => `${i + 1}. *${v.title}*\n${v.url}`).join('\n\n')
        await Dave.sendMessage(from, { text: `🔎 YouTube Search Results for *${query}*:\n\n${list}` }, { quoted: msg })
      } catch (e) {
        await Dave.sendMessage(from, { text: `❌ YouTube search failed: ${e.message}` }, { quoted: msg })
      }
    }
  },

  // IMG
{
  name: 'img',
  description: 'Search images online',
  category: 'search',
  handler: async ({ msg, Dave, from, args, reply }) => {
    const query = args.join(' ')
    if (!query) return reply(`Use: ${prefix}img <query>`)

    try {
      const res = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: 'AIzaSyAoMPfmlZ6zsHD6O1Kq92_o6nUGWnQ5ZbA',
          cx: '52bc936f4d64e4425',
          q: query,
          searchType: 'image',
          num: 3
        }
      })

      const items = res.data.items
      if (!items || items.length === 0) return reply('❌ No images found.')

      for (const item of items) {
        await Dave.sendMessage(from, {
          image: { url: item.link },
          caption: `📷 Image result for: ${query}\n${item.title}`
        }, { quoted: msg })
      }
    } catch (e) {
      console.error('Image search error:', e)
      await reply('❌ Image search failed.')
    }
  }
},

{
  name: 'google',
  description: 'Search Google and return top 5 results',
  category: 'search',
  handler: async ({ msg, Dave, from, args, reply }) => {
    const query = args.join(' ')
    if (!query) return reply(`Use: ${prefix}google <search terms>`)

    try {
      const res = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: 'AIzaSyAoMPfmlZ6zsHD6O1Kq92_o6nUGWnQ5ZbA',
          cx: '52bc936f4d64e4425',
          q: query,
          num: 5
        }
      })

      const items = res.data.items
      if (!items || items.length === 0) return reply('❌ No results found.')

      const text = items.map((item, i) =>
        `${i + 1}. *${item.title}*\n${item.snippet}\n🔗 ${item.link}`
      ).join('\n\n')

      await Dave.sendMessage(from, { text }, { quoted: msg })
    } catch (e) {
      console.error('Google search error:', e)
      await reply('❌ Failed to fetch Google search results.')
    }
  }
},

  // LYRICS
  {
  name: 'lyrics',
  description: 'Fetch lyrics of a song',
  category: 'search',
  handler: async ({ msg, Dave, from, args, reply }) => {
    const query = args.join(' ')
    if (!query) return reply(`🎵 Use: ${prefix}lyrics <song name>`)

    try {
      const res = await fetch(`https://api.giftedtech.web.id/api/search/lyrics?apikey=gifted_api_6hf50c4j&query=${encodeURIComponent(query)}`)
      const json = await res.json()

      if (!json?.result?.lyrics) {
        return reply('❌ Lyrics not found or format invalid. Use: artist - song')
      }

      const { title, artist, image, lyrics } = json.result
      const shortLyrics = lyrics.length > 4000 ? lyrics.slice(0, 4000) + '...' : lyrics

      await Dave.sendMessage(from, {
        image: { url: image },
        caption: `🎤 *${title}* - ${artist}\n\n${shortLyrics}`
      }, { quoted: msg })
    } catch (e) {
      console.error('❌ Lyrics Error:', e)
      reply('❌ Failed to fetch lyrics.')
    }
  }
},

  // WEATHER
  {
    name: 'weather',
    description: 'Check weather info',
    category: 'search',
    handler: async ({ msg, Dave, from, args }) => {
      const city = args.join(' ')
      if (!city) return Dave.sendMessage(from, { text: `Use: ${prefix}weather <city>` }, { quoted: msg })

      try {
        const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=3`)
        await Dave.sendMessage(from, { text: `🌤️ Weather for ${city}:\n${data}` }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: '❌ Weather lookup failed.' }, { quoted: msg })
      }
    }
  },

  // CURRENCY
  {
  name: 'currency',
  description: 'Convert currency using exchangerate-api.com',
  category: 'search',
  handler: async ({ msg, Dave, from, args }) => {
    if (args.length !== 3 || isNaN(args[0])) {
      return Dave.sendMessage(from, { text: `Use: ${config.PREFIX}currency 5000 NGN USD` }, { quoted: msg })
    }

    const amount = parseFloat(args[0])
    const fromCur = args[1].toUpperCase()
    const toCur = args[2].toUpperCase()
    const API_KEY = '9c8b8532d40e5da04fac9772'

    try {
      const { data } = await axios.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${fromCur}/${toCur}/${amount}`)

      if (data.result !== 'success') {
        return Dave.sendMessage(from, { text: `❌ Conversion failed.\nReason: ${data['error-type'] || 'Unknown error.'}` }, { quoted: msg })
      }

      const rate = data.conversion_rate.toFixed(4)
      const total = data.conversion_result

      await Dave.sendMessage(from, {
        text: `💱 ${amount} ${fromCur} → *${total} ${toCur}*\n🔁 Rate: 1 ${fromCur} = ${rate} ${toCur}`
      }, { quoted: msg })

    } catch (err) {
      console.error('Currency Error:', err.message)
      Dave.sendMessage(from, { text: `❌ Currency conversion failed.` }, { quoted: msg })
    }
  }
},

  // GITHUB
  {
    name: 'github',
    description: 'Search GitHub repositories',
    category: 'search',
    handler: async ({ msg, Dave, from, args }) => {
      const query = args.join(' ')
      if (!query) return Dave.sendMessage(from, { text: `Use: ${prefix}github <query>` }, { quoted: msg })

      try {
        const { data } = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=10`)
        const repos = data.items
        if (!repos.length) return Dave.sendMessage(from, { text: '❌ No repositories found.' }, { quoted: msg })

        const list = repos.map((r, i) => `${i + 1}. *${r.full_name}*\n${r.description || 'No description'}\n⭐ ${r.stargazers_count} | 🍴 ${r.forks_count}\n🔗 ${r.html_url}`).join('\n\n')
        await Dave.sendMessage(from, { text: `💻 GitHub Search Results for *${query}*:\n\n${list}` }, { quoted: msg })
      } catch {
        Dave.sendMessage(from, { text: '❌ GitHub search failed.' }, { quoted: msg })
      }
    }
  },

  // WIKI
  {
    name: 'wiki',
    description: 'Search Wikipedia',
    category: 'search',
    handler: async ({ msg, Dave, from, args }) => {
      const term = args.join(' ')
      if (!term) return Dave.sendMessage(from, { text: `Use: ${prefix}wiki <topic>` }, { quoted: msg })

      try {
        const { data } = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`)
        await Dave.sendMessage(from, {
          text: `📖 *${data.title}*\n\n${data.extract}\n\n🔗 ${data.content_urls.desktop.page}`
        }, { quoted: msg })
      } catch {
        Dave.sendMessage(from, { text: '❌ Wikipedia search failed.' }, { quoted: msg })
      }
    }
  },

  // URBAN DICTIONARY
  {
    name: 'ud',
    description: 'Urban Dictionary search',
    category: 'search',
    handler: async ({ msg, Dave, from, args }) => {
      const word = args.join(' ')
      if (!word) return Dave.sendMessage(from, { text: `Use: ${prefix}ud <word>` }, { quoted: msg })

      try {
        const { data } = await axios.get(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`)
        if (!data.list.length) return Dave.sendMessage(from, { text: `❌ No results found.` }, { quoted: msg })

        const def = data.list[0]
        await Dave.sendMessage(from, { text: `📚 *${def.word}*\n\n${def.definition}` }, { quoted: msg })
      } catch {
        Dave.sendMessage(from, { text: `❌ Urban Dictionary search failed.` }, { quoted: msg })
      }
    }
  },

  // NEWS
  {
    name: 'news',
    description: 'Get top news headlines',
    category: 'search',
    handler: async ({ msg, Dave, from }) => {
      try {
        const { data } = await axios.get(`https://api.popcat.xyz/news?country=us`)
        const list = data.slice(0, 5).map((n, i) => `${i + 1}. *${n.title}*\n${n.url}`).join('\n\n')
        await Dave.sendMessage(from, { text: `📰 Top News Headlines:\n\n${list}` }, { quoted: msg })
      } catch {
        Dave.sendMessage(from, { text: `❌ Failed to fetch news.` }, { quoted: msg })
      }
    }
  },

  // MOVIE (IMDb info)
  {
    name: 'movie',
    description: 'Get info about a movie',
    category: 'search',
    handler: async ({ msg, Dave, from, args }) => {
      const title = args.join(' ')
      if (!title) return Dave.sendMessage(from, { text: `Use: ${prefix}movie <title>` }, { quoted: msg })

      try {
        const { data } = await axios.get(`https://www.omdbapi.com/?apikey=76cb7f39&t=${encodeURIComponent(title)}`)
        if (data.Response === 'False') return Dave.sendMessage(from, { text: `❌ Movie not found.` }, { quoted: msg })

        await Dave.sendMessage(from, {
          text: `🎬 *${data.Title}* (${data.Year})\n⭐ ${data.imdbRating}/10\n📚 ${data.Genre}\n📖 ${data.Plot}`
        }, { quoted: msg })
      } catch {
        Dave.sendMessage(from, { text: `❌ Failed to fetch movie info.` }, { quoted: msg })
      }
    }
  }
]