// 📁 plugins/nsfw.js
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const fantoxApiUrl = 'https://fantox-apis.vercel.app'
const giftedApiUrl = 'https://api.giftedtech.web.id/api'
const tempDir = path.resolve(__dirname, '../tmp')
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

const endpoints = [
  'genshin', 'swimsuit', 'schoolswimsuit', 'white', 'barefoot', 'touhou',
  'gamecg', 'hololive', 'uncensored', 'sunglasses', 'glasses', 'weapon',
  'shirtlift', 'chain', 'fingering', 'flatchest', 'torncloth', 'bondage',
  'demon', 'wet', 'pantypull', 'headdress', 'headphone', 'tie', 'anusview',
  'shorts', 'stokings', 'topless', 'beach', 'bunnygirl', 'bunnyear', 'idol',
  'vampire', 'gun', 'maid', 'bra', 'nobra', 'bikini', 'whitehair', 'blonde',
  'pinkhair', 'bed', 'ponytail', 'nude', 'dress', 'underwear', 'foxgirl',
  'uniform', 'skirt', 'sex', 'sex2', 'sex3', 'breast', 'twintail',
  'spreadpussy', 'tears', 'seethrough', 'breasthold', 'drunk', 'fateseries',
  'spreadlegs', 'openshirt', 'headband', 'food', 'close', 'tree', 'nipples',
  'erectnipples', 'horns', 'greenhair', 'wolfgirl', 'catgirl'
]

const plugins = endpoints.map(name => ({
  name,
  description: `Send NSFW image: ${name}`,
  category: 'hentai',
  async handler({ msg, from, reply, Dave }) {
    try {
      const { data } = await axios.get(`${fantoxApiUrl}/${name}`)
      if (!data.url) return reply(`❌ Failed to get image for ${name}`)

      const filePath = path.join(tempDir, `${name}_${Date.now()}.jpg`)
      const response = await axios.get(data.url, { responseType: 'stream' })
      const writer = fs.createWriteStream(filePath)
      response.data.pipe(writer)

      await new Promise((res, rej) => {
        writer.on('finish', res)
        writer.on('error', rej)
      })

      await Dave.sendMessage(from, {
        image: { url: filePath },
        caption: `🔞 NSFW - ${name}`
      }, { quoted: msg })

      fs.unlinkSync(filePath)

    } catch (e) {
      console.error(`❌ ${name} failed:`, e.message)
      reply(`❌ Failed to send ${name} image.`)
    }
  }
}))

plugins.push({
  name: 'xsearch',
  description: 'Search NSFW videos by keyword',
  category: 'hentai',
  use: '<query>',
  async handler({ msg, from, args, reply }) {
    const query = args.join(' ')
    if (!query) return reply('💡 Usage: .xsearch <query>')

    try {
      const { data } = await axios.get(`${giftedApiUrl}/search/xnxxsearch?apikey=gifted_api_6hf50c4j&query=${encodeURIComponent(query)}`)
      if (!data.success || !data.results?.length) return reply(`❌ No results found for "${query}".`)

      let text = `🔞 *Results for "${query}":*\n\n`
      for (const [i, r] of data.results.entries()) {
        text += `${i + 1}. ${r.title}\n🔗 ${r.link}\n\n`
      }

      await reply(text)

    } catch (e) {
      console.error('❌ xsearch error:', e.message)
      reply('❌ Failed to search NSFW content.')
    }
  }
})

plugins.push({
  name: 'xdl',
  description: 'Download NSFW video from XNXX link',
  category: 'hentai',
  use: '<xnxx link>',
  async handler({ msg, from, args, reply, Dave }) {
    const url = args[0]
    if (!url) return reply('💡 Usage: .xdl <xnxx link>')

    try {
      const { data } = await axios.get(`${giftedApiUrl}/download/xnxxdl?apikey=gifted_api_6hf50c4j&url=${encodeURIComponent(url)}`)
      const videoUrl = data?.result?.files?.high
      if (!data.success || !videoUrl) return reply('❌ Could not fetch video link.')

      const filePath = path.join(tempDir, `xdl_${Date.now()}.mp4`)
      const stream = await axios({ url: videoUrl, responseType: 'stream' })
      const writer = fs.createWriteStream(filePath)
      stream.data.pipe(writer)

      await new Promise((res, rej) => {
        writer.on('finish', res)
        writer.on('error', rej)
      })

      await Dave.sendMessage(from, {
        video: { url: filePath },
        caption: `✅ Downloaded from: ${url}`,
        fileName: `${Date.now()}.mp4`,
        mimetype: 'video/mp4'
      }, { quoted: msg })

      fs.unlinkSync(filePath)

    } catch (e) {
      console.error('❌ xdl error:', e.message)
      reply('❌ Failed to download video.')
    }
  }
})

export default plugins