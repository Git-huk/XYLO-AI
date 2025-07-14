import { Sticker, StickerTypes } from 'wa-sticker-formatter'

export default [
  {
    name: 'sticker',
    category: 'tools',
    desc: 'Create sticker from replied media',
    async handler({ m, reply, Dave }) {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      if (!quoted) return reply('⚠️ Reply to an image, gif, or short video.')

      const quotedType = Object.keys(quoted)[0]
      if (!['imageMessage', 'videoMessage', 'stickerMessage'].includes(quotedType))
        return reply('⚠️ Replied message must be image, gif, video, or sticker.')

      try {
        const buffer = await Dave.downloadMediaMessage({ message: quoted })
        if (!buffer) return reply('❌ Failed to download media.')

        if (quotedType === 'stickerMessage') {
          // Forward sticker as is
          await Dave.sendMessage(m.from, { sticker: buffer }, { quoted: m })
          return
        }

        const sticker = new Sticker(buffer, {
          pack: 'XYLO',
          type: StickerTypes.FULL,
          categories: ['🤩', '🎉'],
          id: '12345',
          quality: 75,
          background: 'transparent',
        })

        const stickerBuffer = await sticker.toBuffer()
        await Dave.sendMessage(m.from, { sticker: stickerBuffer }, { quoted: m })
      } catch (e) {
        reply('❌ Error creating sticker: ' + e.message)
      }
    }
  },

  {
    name: 'take',
    category: 'tools',
    desc: 'Steal sticker and rename pack',
    async handler({ m, reply, args, pushname, Dave }) {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      if (!quoted) return reply('⚠️ Reply to a sticker to steal.')

      const quotedType = Object.keys(quoted)[0]
      if (quotedType !== 'stickerMessage')
        return reply('⚠️ Replied message must be a sticker.')

      const packname = args.join(' ') || pushname || 'XYLO'

      try {
        const buffer = await Dave.downloadMediaMessage({ message: quoted })
        if (!buffer) return reply('❌ Failed to download sticker.')

        const sticker = new Sticker(buffer, {
          pack: packname,
          type: StickerTypes.FULL,
          categories: ['🤩', '🎉'],
          id: '12345',
          quality: 75,
          background: 'transparent',
        })

        const stickerBuffer = await sticker.toBuffer()
        await Dave.sendMessage(m.from, { sticker: stickerBuffer }, { quoted: m })
      } catch (e) {
        reply('❌ Error stealing sticker: ' + e.message)
      }
    }
  }
]