import config from '../config.js'
import os from 'os'

const prefix = config.PREFIX

export default [{
  name: 'menu',
  description: 'Show full command list',
  category: 'main',
  use: `${prefix}menu`,
  handler: async ({ msg, Dave, from, pushname, globalPlugins }) => {
    try {
      const totalMem = os.totalmem() / (1024 ** 3)
      const freeMem = os.freemem() / (1024 ** 3)
      const usedMem = totalMem - freeMem

      const version = '3.0.0'
      const uptime = process.uptime()
      const days = Math.floor(uptime / (3600 * 24))
      const hours = Math.floor((uptime % (3600 * 24)) / 3600)
      const minutes = Math.floor((uptime % 3600) / 60)
      const seconds = Math.floor(uptime % 60)
      const uptimeStr = `${days}𝐝 ${hours}𝐡 ${minutes}𝐦 ${seconds}𝐬`

      const now = new Date()
      const date = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
      const time = now.toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true })

      const fancy = (txt) => {
        const map = {
          a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ',
          h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ',
          o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ',
          v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
          "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓",
          "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗", "0": "𝟎"
        }
        return txt.split('').map(c => map[c.toLowerCase()] || c).join('')
      }

      const allPlugins = Array.from(globalPlugins.values())
      const excludeCats = ['menu', 'misc', 'david']
      const filteredPlugins = allPlugins.filter(p => !excludeCats.includes((p.category || '').toLowerCase()))

      const categories = [...new Set(filteredPlugins.map(p => p.category || 'Uncategorized'))]

      let menuText = `╭══〘〘 *𝗫𝗬𝗟𝗢-𝗠𝗗 𝗠𝗘𝗡𝗨* 〙〙══⊷
┃❍ *Mode:* ${config.MODE}
┃❍ *Prefix:* [ ${prefix} ]
┃❍ *User:* ${pushname || 'User'}
┃❍ *Plugins:* ${filteredPlugins.length}
┃❍ *Version:* ${version}
┃❍ *Uptime:* ${uptimeStr}
┃❍ *Date:* ${date}
┃❍ *Time:* ${time}
┃❍ *RAM:* ${usedMem.toFixed(1)}GB / ${totalMem.toFixed(1)}GB
╰═════════════════════⊷\n\n`

      for (const category of categories) {
        const list = filteredPlugins.filter(p => (p.category || 'Uncategorized') === category)
        if (!list.length) continue

        menuText += `╭━━❮ *${category.toUpperCase()}* ❯━⊷\n`
        for (const cmd of list) {
          menuText += `╏ ➜ ${prefix}${fancy(cmd.name || 'unknown')}\n`
        }
        menuText += `╰━━━━━━━━━━━━━━━━━⊷\n\n`
      }

      await Dave.sendMessage(from, {
        image: { url: 'https://i.postimg.cc/rFV2pJW5/IMG-20250603-WA0017.jpg' },
        caption: menuText.trim()
      }, { quoted: msg })

      await Dave.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      })

    } catch (err) {
      console.error('❌ Menu error:', err)
      await Dave.sendMessage(from, {
        text: '⚠️ Failed to generate menu.'
      }, { quoted: msg })
    }
  }
}]