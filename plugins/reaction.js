import fetch from 'node-fetch'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'

const actions = ['hug', 'kiss', 'pat', 'slap', 'wink', 'bonk', 'poke', 'yeet', 'blush', 'wave', 'smile', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'cringe', 'dance']

export default actions.map(action => ({
  name: action,
  category: 'reactions',
  desc: `Send a ${action} sticker`,
  async handler({ m, reply, Dave }) {
    const mentionedUser = m.quoted?.key?.participant || m.mentionedJid?.[0] || ''
    const mentionText = mentionedUser ? `@${mentionedUser.split('@')[0]}` : ''

    try {
      const res = await fetch(`https://api.waifu.pics/sfw/${action}`)
      const json = await res.json()
      if (!json || !json.url) return reply(`❌ Failed to fetch ${action}.`)

      const sticker = new Sticker(await (await fetch(json.url)).buffer(), {
        pack: 'XYLO-MD',
        author: action.toUpperCase(),
        type: StickerTypes.FULL,
        categories: ['💫'],
        id: 'xylo-reaction',
        quality: 75,
        background: 'transparent'
      })

      const stickerBuffer = await sticker.toBuffer()
      await Dave.sendMessage(m.from, {
        sticker: stickerBuffer,
        mentions: [mentionedUser].filter(Boolean)
      }, { quoted: m })

    } catch (e) {
      reply(`❌ Failed to fetch ${action}: ${e.message}`)
    }
  }
}))

      