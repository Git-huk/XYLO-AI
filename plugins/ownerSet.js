import fs from 'fs'
import { exec } from 'child_process'

const bannedUsersPath = './lib/banned.json'
const sudoUsersPath = './lib/sudo.json'

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : []
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

export default [
  {
    name: 'ban',
    category: 'owner',
    description: 'Ban a user',
    handler: async ({ msg, Dave, isOwner }) => {
      if (!isOwner) return Dave.sendMessage(msg.key.remoteJid, { text: '❌ Command reserved for bot owner.' }, { quoted: msg })
      const user = msg.mentionedJid?.[0] || msg.message?.extendedTextMessage?.contextInfo?.participant || msg.key.participant
      if (!user) return Dave.sendMessage(msg.key.remoteJid, { text: 'Mention or reply to a user to ban.' }, { quoted: msg })

      const banned = readJson(bannedUsersPath)
      if (!banned.includes(user)) {
        banned.push(user)
        writeJson(bannedUsersPath, banned)
        await Dave.sendMessage(msg.key.remoteJid, { text: `✅ Banned @${user.split('@')[0]}`, mentions: [user] })
      } else {
        await Dave.sendMessage(msg.key.remoteJid, { text: 'User is already banned.' }, { quoted: msg })
      }
    }
  },

  {
    name: 'unban',
    category: 'owner',
    description: 'Unban a user',
    handler: async ({ msg, Dave, isOwner }) => {
      if (!isOwner) return Dave.sendMessage(msg.key.remoteJid, { text: '❌ Command reserved for bot owner.' }, { quoted: msg })
      const user = msg.mentionedJid?.[0] || msg.message?.extendedTextMessage?.contextInfo?.participant || msg.key.participant
      if (!user) return Dave.sendMessage(msg.key.remoteJid, { text: 'Mention or reply to a user to unban.' }, { quoted: msg })

      let banned = readJson(bannedUsersPath)
      if (banned.includes(user)) {
        banned = banned.filter(id => id !== user)
        writeJson(bannedUsersPath, banned)
        await Dave.sendMessage(msg.key.remoteJid, { text: `✅ Unbanned @${user.split('@')[0]}`, mentions: [user] })
      } else {
        await Dave.sendMessage(msg.key.remoteJid, { text: 'User is not banned.' }, { quoted: msg })
      }
    }
  },

  {
    name: 'listban',
    category: 'owner',
    description: 'List all banned users',
    handler: async ({ Dave, msg, isOwner }) => {
      if (!isOwner) return Dave.sendMessage(msg.key.remoteJid, { text: '❌ Command reserved for bot owner.' }, { quoted: msg })
      const banned = readJson(bannedUsersPath)
      if (!banned.length) return Dave.sendMessage(msg.key.remoteJid, { text: 'No banned users yet.' })
      const text = `🚫 Banned users:\n\n` + banned.map((id, i) => `${i + 1}. @${id.split('@')[0]}`).join('\n')
      await Dave.sendMessage(msg.key.remoteJid, { text, mentions: banned })
    }
  },

  {
    name: 'setsudo',
    category: 'owner',
    description: 'Add a sudo user',
    handler: async ({ msg, Dave, isOwner }) => {
      if (!isOwner) return Dave.sendMessage(msg.key.remoteJid, { text: '❌ Command reserved for bot owner.' }, { quoted: msg })
      const user = msg.mentionedJid?.[0] || msg.message?.extendedTextMessage?.contextInfo?.participant || msg.key.participant
      if (!user) return Dave.sendMessage(msg.key.remoteJid, { text: 'Mention or reply to a user to set as sudo.' }, { quoted: msg })

      const sudo = readJson(sudoUsersPath)
      if (!sudo.includes(user)) {
        sudo.push(user)
        writeJson(sudoUsersPath, sudo)
        await Dave.sendMessage(msg.key.remoteJid, { text: `✅ @${user.split('@')[0]} is now a sudo user.`, mentions: [user] })
      } else {
        await Dave.sendMessage(msg.key.remoteJid, { text: 'User is already a sudo.' }, { quoted: msg })
      }
    }
  },

  {
    name: 'delsudo',
    category: 'owner',
    description: 'Remove a sudo user',
    handler: async ({ msg, Dave, isOwner }) => {
      if (!isOwner) return Dave.sendMessage(msg.key.remoteJid, { text: '❌ Command reserved for bot owner.' }, { quoted: msg })
      const user = msg.mentionedJid?.[0] || msg.message?.extendedTextMessage?.contextInfo?.participant || msg.key.participant
      if (!user) return Dave.sendMessage(msg.key.remoteJid, { text: 'Mention or reply to a user to remove sudo.' }, { quoted: msg })

      let sudo = readJson(sudoUsersPath)
      if (sudo.includes(user)) {
        sudo = sudo.filter(id => id !== user)
        writeJson(sudoUsersPath, sudo)
        await Dave.sendMessage(msg.key.remoteJid, { text: `✅ Removed sudo access from @${user.split('@')[0]}`, mentions: [user] })
      } else {
        await Dave.sendMessage(msg.key.remoteJid, { text: 'User is not a sudo.' }, { quoted: msg })
      }
    }
  },

  {
    name: 'listsudo',
    category: 'owner',
    description: 'List all sudo users',
    handler: async ({ Dave, msg, isOwner }) => {
      if (!isOwner) return Dave.sendMessage(msg.key.remoteJid, { text: '❌ Command reserved for bot owner.' }, { quoted: msg })
      const sudo = readJson(sudoUsersPath)
      if (!sudo.length) return Dave.sendMessage(msg.key.remoteJid, { text: 'No sudo users yet.' })
      const text = `🛡️ Sudo users:\n\n` + sudo.map((id, i) => `${i + 1}. @${id.split('@')[0]}`).join('\n')
      await Dave.sendMessage(msg.key.remoteJid, { text, mentions: sudo })
    }
  },

  {
    name: 'checkupdate',
    description: 'Check for new updates from GitHub',
    category: 'owner',
    handler: async ({ Dave, msg, isOwner }) => {
      if (!isOwner) return Dave.sendMessage(msg.key.remoteJid, { text: '❌ Command reserved for bot owner.' }, { quoted: msg })
      exec('git fetch && git log HEAD..origin/main --oneline', (err, stdout) => {
        if (err || !stdout.trim()) return Dave.sendMessage(msg.key.remoteJid, { text: '✅ Bot is up to date!' })
        const changelog = stdout.split('\n').map(line => '• ' + line.trim()).join('\n')
        Dave.sendMessage(msg.key.remoteJid, { text: `🔄 Updates available:\n\n${changelog}` })
      })
    }
  },

  {
    name: 'update',
    description: 'Pull latest update from GitHub and restart',
    category: 'owner',
    handler: async ({ Dave, msg, isOwner }) => {
      if (!isOwner) return Dave.sendMessage(msg.key.remoteJid, { text: '❌ Command reserved for bot owner.' }, { quoted: msg })

      await Dave.sendMessage(msg.key.remoteJid, { text: '⏳ Updating bot from GitHub...' }, { quoted: msg })
      exec('git pull', (err, stdout, stderr) => {
        if (err) return Dave.sendMessage(msg.key.remoteJid, { text: `❌ Update failed:\n\n${stderr}` }, { quoted: msg })
        Dave.sendMessage(msg.key.remoteJid, { text: `✅ Update completed:\n\n${stdout}\n\nRestarting...` }).then(() => {
          process.exit(0) // Restart bot
        })
      })
    }
  }
]