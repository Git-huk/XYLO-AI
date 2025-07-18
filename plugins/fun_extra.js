import config from '../config.js'
const prefix = config.PREFIX

const emojis = ['🔥', '💫', '✨', '🌈', '💀', '❤️‍🔥', '🧃', '💯', '🥵', '😈', '👑']

export default [
  {
    name: 'vibecheck',
    description: 'Check your current vibe',
    category: 'fun',
    handler: async ({ msg, Dave, from }) => {
      const vibes = [
        'You’re vibing HIGH today 🌈✨',
        'Lowkey chill, highkey powerful 💫',
        'Energy levels: MAXIMUM 🔥',
        'Something feels off… go touch grass 🌱',
        'Your aura is cracked 😈',
        'Vibe check failed 😬'
      ]
      const reply = vibes[Math.floor(Math.random() * vibes.length)]
      await Dave.sendMessage(from, { text: reply }, { quoted: msg })
    }
  },

  {
    name: 'emojiart',
    description: 'Convert text into emoji art',
    category: 'fun',
    handler: async ({ msg, Dave, from, args }) => {
      const text = args.join(' ')
      if (!text) return Dave.sendMessage(from, { text: '❌ Please provide text to convert.' }, { quoted: msg })

      const art = text
        .toUpperCase()
        .split('')
        .map(c => c === ' ' ? '   ' : `${c}️✨`)
        .join(' ')
      await Dave.sendMessage(from, { text: art }, { quoted: msg })
    }
  },

  {
    name: 'shout',
    description: 'SHOUT your message in caps and style',
    category: 'fun',
    handler: async ({ msg, Dave, from, args }) => {
      const text = args.join(' ')
      if (!text) return Dave.sendMessage(from, { text: '❌ Please provide text to shout.' }, { quoted: msg })

      const shoutText = `📣 ${text.toUpperCase().split('').join(' ')} !!!`
      await Dave.sendMessage(from, { text: shoutText }, { quoted: msg })
    }
  },

  {
    name: 'rate',
    description: 'Rate anything from 0–100%',
    category: 'fun',
    handler: async ({ msg, Dave, from, args }) => {
      const thing = args.join(' ')
      if (!thing) return Dave.sendMessage(from, { text: '❌ What should I rate?' }, { quoted: msg })

      const rating = Math.floor(Math.random() * 101)
      await Dave.sendMessage(from, { text: `📊 I rate *${thing}* a solid *${rating}%* ${rating > 80 ? '🔥' : rating < 40 ? '💩' : '👍'}` }, { quoted: msg })
    }
  },

  {
    name: 'fakechat',
    description: 'Fake a reply from any name',
    category: 'fun',
    handler: async ({ msg, Dave, from, args }) => {
      if (args.length < 2) {
        return Dave.sendMessage(from, {
          text: `❌ Usage: ${prefix}fakechat <name> <message>`,
        }, { quoted: msg })
      }

      const name = args[0]
      const message = args.slice(1).join(' ')

      const fakeMsg = {
        key: {
          fromMe: false,
          remoteJid: from,
          id: msg.key.id,
          participant: '0@s.whatsapp.net'
        },
        message: {
          conversation: message
        },
        pushName: name
      }

      await Dave.sendMessage(from, {
        text: message
      }, { quoted: fakeMsg })
    }
  }
]
