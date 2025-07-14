import axios from 'axios'

export default [
  {
    name: 'hentaivid',
    description: 'Random SFM Hentai Video from Manul API',
    category: 'hentai',
    handler: async ({ msg, Dave, from }) => {
      try {
        const res = await axios.get('https://manul-official-api.vercel.app/scrape-hentai?apikey=Manul-Official')
        const videos = res.data?.data?.filter(x => x.type === 'video/mp4')
        if (!videos || videos.length === 0) throw 'No videos found.'

        const pick = videos[Math.floor(Math.random() * videos.length)]

        await Dave.sendMessage(from, {
          video: { url: pick.video_1 },
          caption: `🔞 *${pick.title}*\n🎮 Category: ${pick.category}\n👁️ ${pick.views_count} | 🔗 [Source](${pick.link})`
        }, { quoted: msg })
      } catch (e) {
        await Dave.sendMessage(from, {
          text: '❌ Failed to fetch hentai video.'
        }, { quoted: msg })
      }
    }
  }
]