import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

const GIT_DIR = process.cwd() // Adjust this if needed

const send = (client, jid, text, quoted) =>
  client.sendMessage(jid, { text }, { quoted })

export default [
  {
    name: 'checkupdate',
    description: 'Check for new updates from GitHub',
    category: 'owner',
    handler: async ({ Dave, msg, isOwner }) => {
      if (!isOwner) return msg.reply('❌ Owner only.')

      if (!fs.existsSync(path.join(GIT_DIR, '.git')))
        return send(Dave, msg.key.remoteJid, '❌ Git repo not found in XYLO-AI.', msg)

      exec('git fetch', { cwd: GIT_DIR }, (err) => {
        if (err) return send(Dave, msg.key.remoteJid, '❌ Failed to fetch update info.', msg)

        exec('git rev-list HEAD...origin/main --count', { cwd: GIT_DIR }, (err, stdout) => {
          if (err) return send(Dave, msg.key.remoteJid, '❌ Could not compare commits.', msg)

          const updateCount = parseInt(stdout.trim(), 10)

          if (updateCount === 0) {
            return send(Dave, msg.key.remoteJid, '✅ You are already up to date.', msg)
          }

          // Get last update timestamp
          exec('git log -1 --format=%cd --date=local', { cwd: GIT_DIR }, (err, logOut) => {
            const lastUpdated = err
              ? 'Unknown time'
              : logOut.trim()

            send(Dave, msg.key.remoteJid,
              `🆕 *${updateCount} update(s) available!*\n` +
              `🕒 Last update: ${lastUpdated}\n\n` +
              `💡 Type *update* to apply updates.\n\n` +
              `_Make sure your changes are saved._`, msg)
          })
        })
      })
    }
  },
  {
    name: 'update',
    description: 'Pull latest updates from GitHub and restart bot',
    category: 'owner',
    handler: async ({ Dave, msg, isOwner }) => {
      if (!isOwner) return msg.reply('❌ Owner only.')

      if (!fs.existsSync(path.join(GIT_DIR, '.git')))
        return send(Dave, msg.key.remoteJid, '❌ Git repo not found in XYLO-AI.', msg)

      send(Dave, msg.key.remoteJid, '📥 Pulling updates from GitHub...', msg)

      exec('git pull', { cwd: GIT_DIR }, (err, stdout, stderr) => {
        if (err) return send(Dave, msg.key.remoteJid, `❌ Update failed:\n${stderr}`, msg)

        send(Dave, msg.key.remoteJid, `✅ Update completed:\n\n${stdout}\n\n♻ Restarting...`, msg)
          .then(() => process.exit(0))
      })
    }
  }
]
