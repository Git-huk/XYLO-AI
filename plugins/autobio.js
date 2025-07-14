import axios from 'axios'
import config from '../config.js'
import { setConfig, getConfig } from '../lib/configdb.js'

let bioInterval = null
const timeZone = 'Africa/Lagos'

// Fetch quote from zenquotes.io
async function fetchQuote() {
  try {
    const res = await axios.get('https://zenquotes.io/api/random')
    const q = res.data?.[0]?.q
    const a = res.data?.[0]?.a
    return `"${q}"`
  } catch {
    return "Keep pushing forward — Unknown"
  }
}

// Start auto bio updater
async function startAutoBio(Dave, template, isQuote) {
  stopAutoBio()

  const update = async () => {
    try {
      let status = template
      if (template.includes('{time}')) {
        const now = new Date()
        const timeString = now.toLocaleTimeString('en-US', { timeZone })
        status = template.replace('{time}', timeString)
      }
      if (template.includes('{quote}')) {
        const quote = await fetchQuote()
        status = template.replace('{quote}', quote)
      }
      await Dave.setStatus(status)
    } catch (err) {
      console.error('❌ Auto bio failed:', err.message)
      stopAutoBio()
    }
  }

  await update()
  bioInterval = setInterval(update, isQuote ? 86400000 : 60000)
}

// Stop bio interval
function stopAutoBio() {
  if (bioInterval) {
    clearInterval(bioInterval)
    bioInterval = null
  }
}

export default [
  {
    name: 'autobio',
    category: 'owner',
    desc: 'Toggle automatic bio updates (time or quote)',
    async handler({ args, isOwner, reply, Dave }) {
      if (!isOwner) return reply('❌ Only the bot owner can use this command.')

      const mode = args[0]?.toLowerCase()

      if (!mode) {
        const state = (await getConfig('auto_bio_state')) || 'off'
        const current = (await getConfig('auto_bio_template')) || 'None'
        return reply(
`📡 *Auto Bio:* ${state === 'on' ? 'Enabled' : 'Disabled'}

*Current Template:*
${current}

🛠️ Usage:
${config.PREFIX}autobio time  → Time-based bio
${config.PREFIX}autobio quote → Quote-of-the-day
${config.PREFIX}autobio off   → Turn off`
        )
      }

      if (mode === 'off') {
        await setConfig('auto_bio_state', 'off')
        await setConfig('auto_bio_template', '')
        stopAutoBio()
        return reply('✅ Auto bio disabled.')
      }

      if (mode === 'time') {
        const template = '⏰ XYLO-MD | Online - {time}'
        await setConfig('auto_bio_state', 'on')
        await setConfig('auto_bio_template', template)
        await startAutoBio(Dave, template, false)
        return reply('✅ Time-based auto bio enabled.')
      }

      if (mode === 'quote') {
        const template = '📜 Quote: {quote}'
        await setConfig('auto_bio_state', 'on')
        await setConfig('auto_bio_template', template)
        await startAutoBio(Dave, template, true)
        return reply('✅ Quote-of-the-day auto bio enabled.')
      }

      return reply('⚠️ Invalid option. Use "time", "quote", or "off".')
    }
  }
]

// 🔁 Start interval immediately if enabled
setTimeout(async () => {
  try {
    const state = await getConfig('auto_bio_state')
    const template = await getConfig('auto_bio_template')
    if (state === 'on' && template) {
      const isQuote = template.includes('{quote}')
      const { default: config } = await import('../config.js')
      global?.globalPlugins?.size // ensure plugin system is loaded
      const Dave = global?.globalClient || global?.Dave
      if (Dave && Dave.setStatus) {
        await startAutoBio(Dave, template, isQuote)
        console.log('✅ Auto bio interval resumed from saved state.')
      }
    }
  } catch (e) {
    console.warn('⚠️ Failed to resume auto bio on load:', e.message)
  }
}, 3000)