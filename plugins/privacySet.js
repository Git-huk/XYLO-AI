import config from '../config.js'
import { downloadMediaMessage } from 'baileys'
import fs from 'fs'
import path from 'path'
const prefix = config.PREFIX

export default [
  {
    name: 'getprivacy',
    description: 'View the current WhatsApp privacy settings of the bot number',
    category: 'settings',
    owner: true,
    handler: async ({ msg, Dave, from }) => {
      try {
        const settings = await Dave.fetchPrivacySettings?.()
        if (!settings) {
          return Dave.sendMessage(from, { text: '❌ Unable to fetch privacy settings.' }, { quoted: msg })
        }

        const text = `🔐 *Bot Privacy Settings*\n\n` +
          Object.entries(settings)
            .map(([k, v]) => `• *${k}*: \`${v}\``).join('\n') +
          `\n\nTo change settings, use:\n${prefix}setprivacy <setting> <value>`

        await Dave.sendMessage(from, { text }, { quoted: msg })
      } catch (e) {
        await Dave.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: msg })
      }
    }
  },

  {
    name: 'setprivacy',
    description: 'Update a bot number privacy setting',
    category: 'settings',
    owner: true,
    usage: `${prefix}setprivacy <setting> <value>`,
    handler: async ({ msg, Dave, from, args }) => {
      if (args.length < 2) {
        return Dave.sendMessage(from, {
          text: `❓ Usage: ${prefix}setprivacy <setting> <value>\n\nSettings: lastseen, online, profile, status, groupadd, calladd\nValues: all, contacts, contact_blacklist, none, match_last_seen`,
        }, { quoted: msg })
      }

      const [setting, value] = args
      const validSettings = ['lastseen', 'online', 'profile', 'status', 'groupadd', 'calladd']
      const validValues = ['all', 'contacts', 'contact_blacklist', 'none', 'match_last_seen']

      if (!validSettings.includes(setting.toLowerCase())) {
        return Dave.sendMessage(from, { text: `❌ Invalid setting: ${setting}` }, { quoted: msg })
      }

      if (!validValues.includes(value.toLowerCase())) {
        return Dave.sendMessage(from, { text: `❌ Invalid value: ${value}` }, { quoted: msg })
      }

      try {
        await Dave.updatePrivacySetting(setting.toLowerCase(), value.toLowerCase())
        await Dave.sendMessage(from, {
          text: `✅ Updated *${setting}* to *${value}*`
        }, { quoted: msg })
      } catch (e) {
        await Dave.sendMessage(from, {
          text: `❌ Failed to update setting: ${e.message}`
        }, { quoted: msg })
      }
    }
  },

  {
    name: 'setpp',
    description: 'Set bot number profile picture (reply image)',
    category: 'settings',
    owner: true,
    handler: async ({ msg, Dave, from }) => {
      if (!msg.quoted || !msg.quoted.message?.imageMessage) {
        return Dave.sendMessage(from, { text: '🖼️ Please reply to an image to use as profile picture.' }, { quoted: msg })
      }

      try {
        const stream = await downloadMediaMessage(msg.quoted, 'buffer', {}, { reuploadRequest: Dave })
        const filename = `./tmp/${Date.now()}.jpg`
        fs.writeFileSync(filename, stream)

        await Dave.updateProfilePicture(Dave.user.id, { url: path.resolve(filename) })
        fs.unlinkSync(filename)
        await Dave.sendMessage(from, { text: '✅ Profile picture updated!' }, { quoted: msg })
      } catch (e) {
        await Dave.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: msg })
      }
    }
  },

  {
    name: 'setbio',
    description: 'Update bot number bio',
    category: 'settings',
    owner: true,
    handler: async ({ msg, Dave, from, args }) => {
      const bio = args.join(' ')
      if (!bio) return Dave.sendMessage(from, { text: '✏️ Please provide a bio to set.' }, { quoted: msg })

      if (bio.length > 139) return Dave.sendMessage(from, { text: '❌ Bio too long (max 139 characters).' }, { quoted: msg })

      try {
        await Dave.updateProfileStatus(bio)
        await Dave.sendMessage(from, { text: '✅ Bio updated successfully!' }, { quoted: msg })
      } catch (e) {
        await Dave.sendMessage(from, { text: `❌ Failed to update bio: ${e.message}` }, { quoted: msg })
      }
    }
  },

  {
    name: 'setname',
    description: 'Update bot number display name',
    category: 'settings',
    owner: true,
    handler: async ({ msg, Dave, from, args }) => {
      const name = args.join(' ')
      if (!name) return Dave.sendMessage(from, { text: '✏️ Please provide a new name.' }, { quoted: msg })

      try {
        await Dave.updateProfileName(name)
        await Dave.sendMessage(from, { text: `✅ Name updated to *${name}*` }, { quoted: msg })
      } catch (e) {
        await Dave.sendMessage(from, { text: `❌ Failed to update name: ${e.message}` }, { quoted: msg })
      }
    }
  }
]