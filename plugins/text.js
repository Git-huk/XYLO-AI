import config from '../config.js'
import fancyTextStyles from '../data/fancytexts.js'
const prefix = config.PREFIX

export default [
  {
    name: 'say',
    description: 'Repeat text multiple times',
    category: 'text',
    usage: `${prefix}say <text> [repeat_count]`,
    handler: async ({ msg, Dave, from, args }) => {
      if (!args.length) return Dave.sendMessage(from, { text: '🗣️ What should I say?' }, { quoted: msg })

      let count = 1
      const last = args[args.length - 1]
      if (!isNaN(last)) {
        count = parseInt(last)
        args.pop()
      }

      if (count < 1 || count > 300) {
        return Dave.sendMessage(from, { text: '⚠️ Repeat count must be between 1 and 300.' }, { quoted: msg })
      }

      const text = args.join(' ')
      const output = Array(count).fill(text).join('\n')
      await Dave.sendMessage(from, { text: output }, { quoted: msg })
    }
  },

  {
    name: 'fancy',
    description: 'Convert text to fancy fonts (1-54)',
    category: 'text',
    usage: `${prefix}fancy <style_number> <text>`,
    handler: async ({ msg, Dave, from, args }) => {
      if (args.length < 2) {
        return Dave.sendMessage(from, { text: '📌 Usage: fancy <style_number> <text>' }, { quoted: msg })
      }

      const styleNumber = parseInt(args[0])
      const inputText = args.slice(1).join(' ')

      if (isNaN(styleNumber) || styleNumber < 1 || styleNumber > fancyTextStyles.length) {
        return Dave.sendMessage(from, {
          text: `⚠️ Style must be between 1 and ${fancyTextStyles.length}`,
        }, { quoted: msg })
      }

      const styleMap = fancyTextStyles[styleNumber - 1]
      const fancy = inputText.split('').map(ch => styleMap[ch] || ch).join('')
      await Dave.sendMessage(from, { text: `🌈 *Fancy ${styleNumber}:*\n\n${fancy}` }, { quoted: msg })
    }
  },

  {
    name: 'fancylist',
    description: 'Show all available fancy text styles',
    category: 'text',
    usage: `${prefix}fancylist`,
    handler: async ({ Dave, from, msg }) => {
      let out = '*📚 Fancy Styles (1 - ' + fancyTextStyles.length + ')*\n\n'
      const sample = 'Xylo-MD'
      fancyTextStyles.forEach((style, index) => {
        const preview = sample.split('').map(c => style[c] || c).join('')
        out += `${index + 1}. ${preview}\n`
      })
      await Dave.sendMessage(from, { text: out }, { quoted: msg })
    }
  }
]