import config from '../config.js'
import { setConfig } from '../lib/configdb.js'

export default [
  {
    name: 'mode',
    aliases: ['setmode'],
    description: 'Set bot mode to public or private',
    category: 'owner',
    handler: async ({ msg, args, Dave, from, isOwner }) => {
      if (!isOwner) {
        return Dave.sendMessage(from, { text: '❌ Only owners can change bot mode.' }, { quoted: msg })
      }

      const mode = args[0]?.toLowerCase()
      if (!['public', 'private'].includes(mode)) {
        return Dave.sendMessage(from, {
          text: `⚙️ *Usage:*\n.mode public\n.mode private\n\n_Current mode: ${config.MODE}_`
        }, { quoted: msg })
      }

      await setConfig('mode', mode)
      return Dave.sendMessage(from, {
        text: `✅ Mode changed to *${mode.toUpperCase()}*`
      }, { quoted: msg })
    }
  },

  {
    name: 'restart',
    aliases: ['reboot'],
    description: 'Restart the bot',
    category: 'owner',
    handler: async ({ msg, Dave, isOwner, from }) => {
      if (!isOwner) {
        return Dave.sendMessage(from, { text: '❌ Only owners can restart the bot.' }, { quoted: msg })
      }

      await Dave.sendMessage(from, { text: '♻️ Restarting bot...' }, { quoted: msg })
      process.exit(1)
    }
  },

  {
    name: 'broadcast',
    aliases: ['bc'],
    description: 'Send a message to all groups',
    category: 'owner',
    handler: async ({ msg, args, Dave, isOwner, from }) => {
      if (!isOwner) {
        return Dave.sendMessage(from, { text: '❌ Only owners can broadcast.' }, { quoted: msg })
      }

      const text = args.join(' ')
      if (!text) {
        return Dave.sendMessage(from, {
          text: '📢 Usage: .broadcast Your message here'
        }, { quoted: msg })
      }

      const groups = await Dave.groupFetchAllParticipating()
      const all = Object.keys(groups)

      for (const jid of all) {
        await new Promise(r => setTimeout(r, 700)) // Avoid rate-limits
        await Dave.sendMessage(jid, { text })
      }

      await Dave.sendMessage(from, {
        text: `✅ Broadcast sent to ${all.length} groups.`
      }, { quoted: msg })
    }
  }
]