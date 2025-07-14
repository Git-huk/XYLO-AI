import { getConfig, setConfig } from '../lib/configdb.js'
import config from '../config.js'

export default [

  {
    name: 'autoview',
    description: 'Toggle or check auto view status mode',
    category: 'owner',
    handler: async ({ msg, Dave, from, isOwner, args }) => {
      if (!isOwner) {
        return await Dave.sendMessage(from, {
          text: '❌ Only the bot *owner(s)* can use this command.'
        }, { quoted: msg })
      }

      const key = 'autoview_status'
      const current = await getConfig(key)

      const toggle = args[0]?.toLowerCase()
      if (!toggle || !['on', 'off'].includes(toggle)) {
        return await Dave.sendMessage(from, {
          text: `🔁 *Auto View Status*\n\nCurrent: *${current ? 'ON ✅' : 'OFF ❌'}*\n\nUsage:\n${config.PREFIX}autoview on\n${config.PREFIX}autoview off`
        }, { quoted: msg })
      }

      const newState = toggle === 'on'
      await setConfig(key, newState)

      await Dave.sendMessage(from, {
        text: `👁️ Auto *View Status* is now *${newState ? 'ON ✅' : 'OFF ❌'}*`
      }, { quoted: msg })
    }
  },

  {
    name: 'autolike',
    description: 'Toggle or check auto react (like) to statuses',
    category: 'owner',
    handler: async ({ msg, Dave, from, isOwner, args }) => {
      if (!isOwner) {
        return await Dave.sendMessage(from, {
          text: '❌ Only the bot *owner(s)* can use this command.'
        }, { quoted: msg })
      }

      const key = 'autolike_status'
      const current = await getConfig(key)

      const toggle = args[0]?.toLowerCase()
      if (!toggle || !['on', 'off'].includes(toggle)) {
        return await Dave.sendMessage(from, {
          text: `🔁 *Auto Like Status*\n\nCurrent: *${current ? 'ON ✅' : 'OFF ❌'}*\n\nUsage:\n${config.PREFIX}autolike on\n${config.PREFIX}autolike off`
        }, { quoted: msg })
      }

      const newState = toggle === 'on'
      await setConfig(key, newState)

      await Dave.sendMessage(from, {
        text: `❤️ Auto *React Status* is now *${newState ? 'ON ✅' : 'OFF ❌'}*`
      }, { quoted: msg })
    }
  }

]