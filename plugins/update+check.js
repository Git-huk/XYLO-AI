import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const GIT_DIR = process.cwd()

const send = (client, jid, text, quoted) =>
  client.sendMessage(jid, { text }, { quoted })

function hashFile(filePath) {
  if (!fs.existsSync(filePath)) return ''
  const content = fs.readFileSync(filePath)
  return crypto.createHash('sha1').update(content).digest('hex')
}

export default [
  {
    name: 'checkupdate',
    description: 'Check for new updates from GitHub',
    category: 'owner',
    handler: async ({ Dave, msg, isOwner }) => {
      if (!isOwner) return msg.reply('❌ Owner only.')

      const jid = msg.key.remoteJid

      if (!fs.existsSync(path.join(GIT_DIR, '.git')))
        return send(Dave, jid, '❌ Git repo not found in XYLO-AI.', msg)

      exec('git fetch', { cwd: GIT_DIR }, (err) => {
        if (err) return send(Dave, jid, '❌ Failed to fetch update info.', msg)

        exec('git rev-list HEAD...origin/main --count', { cwd: GIT_DIR }, (err, stdout) => {
          if (err) return send(Dave, jid, '❌ Could not compare commits.', msg)

          const updateCount = parseInt(stdout.trim(), 10)
          if (updateCount === 0) {
            return send(Dave, jid, '✅ You are already up to date.', msg)
          }

          exec('git log -1 --format=%cd --date=local', { cwd: GIT_DIR }, (err, logOut) => {
            const lastUpdated = err ? 'Unknown time' : logOut.trim()
            send(Dave, jid,
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

      const jid = msg.key.remoteJid

      if (!fs.existsSync(path.join(GIT_DIR, '.git')))
        return send(Dave, jid, '❌ Git repo not found in XYLO-AI.', msg)

      // Get file hashes before pulling
      const hashBefore = {
        pkg: hashFile(path.join(GIT_DIR, 'package.json')),
        lock: hashFile(path.join(GIT_DIR, 'package-lock.json'))
      }

      send(Dave, jid, '📥 Pulling updates from GitHub...', msg)

      exec('git reset --hard HEAD && git pull', { cwd: GIT_DIR }, (err, stdout, stderr) => {
        if (err) return send(Dave, jid, `❌ Update failed:\n${stderr}`, msg)

        const hashAfter = {
          pkg: hashFile(path.join(GIT_DIR, 'package.json')),
          lock: hashFile(path.join(GIT_DIR, 'package-lock.json'))
        }

        const shouldInstall = hashBefore.pkg !== hashAfter.pkg || hashBefore.lock !== hashAfter.lock

        const restartBot = () => {
          send(Dave, jid, `✅ Update completed:\n\n${stdout}\n\n♻ Restarting...`, msg)
            .then(() => process.exit(0))
        }

        if (shouldInstall) {
          send(Dave, jid, '📦 Detected dependency change. Installing...', msg)
          exec('npm install', { cwd: GIT_DIR }, (err2, out2, errOut2) => {
            if (err2) return send(Dave, jid, `❌ npm install failed:\n${errOut2}`, msg)
            send(Dave, jid, '✅ Dependencies installed.').then(restartBot)
          })
        } else {
          restartBot()
        }
      })
    }
  }
]
