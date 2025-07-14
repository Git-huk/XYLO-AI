import { setConfig } from '../lib/configdb.js'
import config from '../config.js'

export default [
  {
    name: 'setprefix',
    category: 'config',
    description: 'Change the bot prefix (supports emoji, text, etc)',
    handler: async ({ args, msg, from, isOwner, Dave }) => {
      if (!isOwner) {
        return await Dave.sendMessage(from, {
          text: '❌ Only owners can change the prefix.'
        }, { quoted: msg })
      }

      const newPrefix = args.join(' ').trim()

      if (!newPrefix) {
        return await Dave.sendMessage(from, {
          text: `📌 Current Prefix: *${config.PREFIX}*\n\nUsage:\n${config.PREFIX}setprefix [new prefix]`
        }, { quoted: msg })
      }

      await setConfig('prefix', newPrefix)
      await Dave.sendMessage(from, {
        text: `✅ Prefix successfully changed to: *${newPrefix}*`
      }, { quoted: msg })
    }
  }
]