import config from '../config.js'
const prefix = config.PREFIX
const startTime = Date.now()

export default [
  {
    name: 'ping',
    description: 'Bot response speed test',
    category: 'misc',
    handler: async ({ msg, Dave, from }) => {
      const start = Date.now()
      await Dave.sendMessage(from, { text: '🏓 Pong!' }, { quoted: msg })
      const ping = Date.now() - start
      await Dave.sendMessage(from, { text: `⏱️ Response time: ${ping}ms` }, { quoted: msg })
    }
  },

  {
    name: 'uptime',
    description: 'Bot uptime status',
    category: 'misc',
    handler: async ({ msg, Dave, from }) => {
      const ms = Date.now() - startTime
      const seconds = Math.floor((ms / 1000) % 60)
      const minutes = Math.floor((ms / (1000 * 60)) % 60)
      const hours = Math.floor((ms / (1000 * 60 * 60)))
      const uptime = `${hours}h ${minutes}m ${seconds}s`
      await Dave.sendMessage(from, { text: `🕐 Bot Uptime: ${uptime}` }, { quoted: msg })
    }
  },

  {
    name: 'runtime',
    description: 'Bot runtime details',
    category: 'misc',
    handler: async ({ msg, Dave, from }) => {
      const memory = process.memoryUsage().rss / 1024 / 1024
      const nodeVer = process.version

      await Dave.sendMessage(from, {
        text: `📊 *Bot Runtime Info*\n\n- Node.js: ${nodeVer}\n- RAM: ${memory.toFixed(2)} MB\n- Prefix: ${prefix}`
      }, { quoted: msg })
    }
  },

  {
    name: 'owner',
    description: 'Bot owner contact',
    category: 'misc',
    handler: async ({ Dave, from }) => {
      await Dave.sendMessage(from, {
        contacts: {
          displayName: 'Owner',
          contacts: [{
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:DavidX\nTEL;waid=2349133354644:+234 913 335 4644\nEND:VCARD`
          }]
        }
      })
    }
  },

  {
    name: 'echo',
    description: 'Echo back your message',
    category: 'misc',
    usage: `${prefix}echo hello world`,
    handler: async ({ msg, Dave, from, body }) => {
      const text = body.slice(body.indexOf(' ') + 1).trim()
      if (!text) return Dave.sendMessage(from, { text: '❗ Enter a message to say.' }, { quoted: msg })
      await Dave.sendMessage(from, { text }, { quoted: msg })
    }
  },

  {
    name: 'alive',
    description: 'Check if bot is working',
    category: 'misc',
    handler: async ({ msg, Dave, from }) => {
      await Dave.sendMessage(from, {
        text: `✅ *I'm Alive!*\n\n- Prefix: ${prefix}\n- Uptime: ${
          Math.floor((Date.now() - startTime) / 1000)
        }s`
      }, { quoted: msg })
    }
  }
]