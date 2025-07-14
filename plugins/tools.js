import config from '../config.js'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

const prefix = config.PREFIX

export default [
  {
    name: 'shorten',
    description: 'Shorten a long URL',
    category: 'tools',
    handler: async ({ msg, args, Dave, from }) => {
      const url = args[0]
      if (!url?.startsWith('http')) {
        return Dave.sendMessage(from, { text: `❗ Usage: ${prefix}shorten https://example.com` }, { quoted: msg })
      }

      try {
        const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
        await Dave.sendMessage(from, { text: `🔗 Short URL: ${res.data}` }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: '❌ Failed to shorten link.' }, { quoted: msg })
      }
    }
  },

  {
    name: 'qr',
    description: 'Generate QR code from text',
    category: 'tools',
    handler: async ({ msg, args, Dave, from }) => {
      const text = args.join(' ')
      if (!text) return Dave.sendMessage(from, { text: `❗ Usage: ${prefix}qr your text here` }, { quoted: msg })

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(text)}`
      await Dave.sendMessage(from, { image: { url: qrUrl }, caption: '✅ QR Code generated' }, { quoted: msg })
    }
  },

  {
    name: 'ss',
    description: 'Take website screenshot',
    category: 'tools',
    handler: async ({ msg, args, Dave, from }) => {
      const url = args[0]
      if (!url?.startsWith('http')) {
        return Dave.sendMessage(from, { text: `❗ Usage: ${prefix}ss https://example.com` }, { quoted: msg })
      }

      try {
        const ssUrl = `https://image.thum.io/get/width/800/crop/800/fullpage/${encodeURIComponent(url)}`
        await Dave.sendMessage(from, { image: { url: ssUrl }, caption: '📸 Screenshot loaded' }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: '❌ Screenshot failed.' }, { quoted: msg })
      }
    }
  },

  {
    name: 'calc',
    description: 'Evaluate a math expression',
    category: 'tools',
    handler: async ({ msg, args, Dave, from }) => {
      const expression = args.join(' ')
      if (!expression) return Dave.sendMessage(from, { text: `❗ Usage: ${prefix}calc 2 + 2` }, { quoted: msg })

      try {
        const result = Function(`return ${expression}`)()
        await Dave.sendMessage(from, { text: `🧮 Result: ${result}` }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: '❌ Invalid math expression.' }, { quoted: msg })
      }
    }
  },

  {
    name: 'ip',
    description: 'Lookup IP address info',
    category: 'tools',
    handler: async ({ msg, args, Dave, from }) => {
      const ip = args[0]
      if (!ip) return Dave.sendMessage(from, { text: `❗ Usage: ${prefix}ip 8.8.8.8` }, { quoted: msg })

      try {
        const res = await axios.get(`https://ipapi.co/${ip}/json/`)
        const data = res.data
        await Dave.sendMessage(from, {
          text: `📍 *IP Info:*\n\n- IP: ${data.ip}\n- City: ${data.city}\n- Country: ${data.country_name}\n- ISP: ${data.org}`
        }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: '❌ Failed to lookup IP.' }, { quoted: msg })
      }
    }
  },
  {
  name: 'translate',
  description: 'Smart translate with language code (auto-detect input)',
  category: 'tools',
  alias: ['trt'],
  handler: async ({ msg, args, Dave, from }) => {
    try {
      let lang = 'en'
      let text = ''

      if (msg.quoted) {
        if (args[0]?.length === 2) lang = args.shift().toLowerCase()
        text = msg.quoted.body
      } else {
        if (args.length === 0) {
          return Dave.sendMessage(from, {
            text: `❗ Usage:\n${prefix}trt ja Hello\n${prefix}trt fr (reply)\n${prefix}trt (reply to translate to English)`
          }, { quoted: msg })
        }

        if (args[0]?.length === 2 && args.length > 1) {
          lang = args.shift().toLowerCase()
          text = args.join(' ')
        } else {
          text = args.join(' ')
        }
      }

      if (!text) return Dave.sendMessage(from, { text: '⚠️ No text to translate.' }, { quoted: msg })

      // Try MyMemory (source: en as fallback from auto)
      const memUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`
      const memRes = await axios.get(memUrl)
      let translated = memRes.data?.responseData?.translatedText
      let detectedLang = memRes.data?.responseData?.detectedSourceLanguage || 'EN'

      if (!translated || translated.toLowerCase().includes('invalid') || translated.length < 3) {
        // fallback to Google
        const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`
        const gRes = await axios.get(gUrl)
        translated = gRes.data[0].map(t => t[0]).join('')
        detectedLang = gRes.data[2] || 'auto'
      }

      await Dave.sendMessage(from, {
        text: `🌐 *Translated (${detectedLang.toUpperCase()} ➜ ${lang.toUpperCase()}):*\n\n${translated}`
      }, { quoted: msg })

    } catch (e) {
      console.error('❌ Translate error:', e)
      await Dave.sendMessage(from, {
        text: '❌ Failed to translate.'
      }, { quoted: msg })
    }
  }
},

  {
    name: 'uuid',
    description: 'Generate random UUID',
    category: 'tools',
    handler: async ({ msg, Dave, from }) => {
      const id = uuidv4()
      await Dave.sendMessage(from, { text: `🆔 UUID: ${id}` }, { quoted: msg })
    }
  },

  {
    name: 'time',
    description: 'Show current time & date',
    category: 'tools',
    handler: async ({ msg, Dave, from }) => {
      const now = new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })
      await Dave.sendMessage(from, { text: `⏰ Current Time (NG): ${now}` }, { quoted: msg })
    }
  }
]