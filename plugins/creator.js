import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const isOwner = (m, Dave) => {
  try {
    const jid = Dave.decodeJid?.(m?.sender || '') || ''
    return ['2349133354644@s.whatsapp.net'].includes(jid)
  } catch {
    return false
  }
}

export default [
  {
    name: 'eval',
    description: 'Evaluate JavaScript code',
    category: 'creator',
    async handler({ m, args, Dave }) {
      if (!isOwner(m, Dave)) return m.reply('❌ *Access denied.*')
      if (!args[0]) return m.reply('⚠️ Please provide JavaScript code.')
      try {
        let code = args.join(' ')
        let result = await eval(`(async () => { ${code} })()`)
        if (typeof result !== 'string') result = JSON.stringify(result, null, 2)
        m.reply(`✅ *Eval Result:*\n\`\`\`\n${result.slice(0, 4000)}\n\`\`\``)
      } catch (err) {
        m.reply(`❌ *Error:*\n\`\`\`${err.message}\`\`\``)
      }
    }
  },

  {
    name: 'js',
    description: 'Alias for eval',
    category: 'creator',
    async handler(ctx) {
      const handlers = Array.isArray(ctx.handler) ? ctx.handler : Array.from(ctx.handler?.values?.() || [])
      const evalCmd = handlers.find(c => c.name === 'eval')
      if (evalCmd) await evalCmd.handler(ctx)
      else ctx.m.reply('❌ *Eval command not found.*')
    }
  },

  {
    name: 'shell',
    description: 'Execute terminal command',
    category: 'creator',
    async handler({ m, args, Dave }) {
      if (!isOwner(m, Dave)) return m.reply('❌ *Access denied.*')
      const cmd = args.join(' ')
      exec(cmd, (err, stdout, stderr) => {
        if (err) return m.reply(`❌ Error:\n\`\`\`${err.message}\`\`\``)
        let output = stdout || stderr
        if (output.length > 4000) output = output.slice(0, 4000) + '\n...[truncated]'
        m.reply(`📄 *Shell Output:*\n\`\`\`\n${output}\n\`\`\``)
      })
    }
  },

  {
    name: 'getcmd',
    description: 'Show source of a command handler',
    category: 'creator',
    async handler({ m, args, Dave, handler }) {
      if (!isOwner(m, Dave)) return m.reply('❌ *Access denied.*')
      const cmd = args[0]
      if (!cmd) return m.reply('⚠️ Specify command name.')

      const handlers = Array.isArray(handler) ? handler : Array.from(handler?.values?.() || [])
      const found = handlers.find(p => p.name === cmd)

      if (!found) return m.reply(`❌ Command *${cmd}* not found.`)

      let code = found.handler?.toString()
      if (!code) return m.reply('❌ Could not get handler code.')

      if (code.length > 4000) code = code.slice(0, 4000) + '\n...[truncated]'
      m.reply(`📜 *Handler for ${cmd}:*\n\`\`\`\n${code}\n\`\`\``)
    }
  },

  {
    name: 'install',
    description: 'Install npm package',
    category: 'creator',
    async handler({ m, args, Dave }) {
      if (!isOwner(m, Dave)) return m.reply('❌ *Access denied.*')
      const pkg = args[0]
      if (!pkg) return m.reply('⚠️ Specify a package.')
      exec(`npm install ${pkg}`, (err, stdout, stderr) => {
        if (err) return m.reply(`❌ Error:\n${err.message}`)
        m.reply(`📦 Installed *${pkg}*:\n${stdout || stderr}`)
      })
    }
  },

  {
    name: 'deleteplugin',
    description: 'Delete plugin file',
    category: 'creator',
    async handler({ m, args, Dave }) {
      if (!isOwner(m, Dave)) return m.reply('❌ *Access denied.*')
      const file = args[0]
      if (!file) return m.reply('⚠️ Provide plugin name (without .js)')
      try {
        await fs.unlink(path.join(process.cwd(), 'plugins', `${file}.js`))
        m.reply(`🗑️ Deleted plugin: *${file}*`)
      } catch (e) {
        m.reply(`❌ Delete error: ${e.message}`)
      }
    }
  },

  {
    name: 'listplugins',
    description: 'List available plugin files',
    category: 'creator',
    async handler({ m, Dave }) {
      if (!isOwner(m, Dave)) return m.reply('❌ *Access denied.*')
      try {
        const files = await fs.readdir(path.join(process.cwd(), 'plugins'))
        const list = files.filter(f => f.endsWith('.js')).map(f => `📁 ${f}`).join('\n')
        m.reply(`*Available Plugins:*\n${list}`)
      } catch {
        m.reply('❌ Failed to list plugins.')
      }
    }
  },

  {
    name: 'sysinfo',
    description: 'Show system info',
    category: 'creator',
    async handler({ m, Dave }) {
      if (!isOwner(m, Dave)) return m.reply('❌ *Access denied.*')
      const info = `
🖥 OS: ${os.type()} ${os.release()}
🧠 CPU: ${os.cpus()[0].model}
🧩 Cores: ${os.cpus().length}
💾 RAM: ${(os.totalmem() / 1e9).toFixed(2)} GB
⏱ Uptime: ${(os.uptime() / 3600).toFixed(1)} hrs
      `.trim()
      m.reply(info)
    }
  },

  {
    name: 'writefile',
    description: 'Write text to file',
    category: 'creator',
    async handler({ m, args, Dave }) {
      if (!isOwner(m, Dave)) return m.reply('❌ *Access denied.*')
      const [filename, ...content] = args
      if (!filename || !content.length) return m.reply('⚠️ Usage: writefile path content')
      try {
        await fs.writeFile(path.join(process.cwd(), filename), content.join(' '))
        m.reply(`✅ Wrote to *${filename}*`)
      } catch (e) {
        m.reply(`❌ Write error: ${e.message}`)
      }
    }
  },

  {
    name: 'readfile',
    description: 'Read file content',
    category: 'creator',
    async handler({ m, args, Dave }) {
      if (!isOwner(m, Dave)) return m.reply('❌ *Access denied.*')
      const file = args[0]
      if (!file) return m.reply('⚠️ Provide file path.')
      try {
        const fullPath = path.join(process.cwd(), file)
        const content = await fs.readFile(fullPath, 'utf-8')
        if (content.length > 4000) {
          await Dave.sendMessage(m.from, {
            document: { url: `file://${fullPath}` },
            fileName: path.basename(file),
            mimetype: 'text/plain'
          }, { quoted: m })
        } else {
          m.reply(`📄 *${file}:*\n\`\`\`\n${content}\n\`\`\``)
        }
      } catch (e) {
        m.reply(`❌ Read error: ${e.message}`)
      }
    }
  }
]