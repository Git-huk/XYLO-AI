import config from '../config.js'
import axios from 'axios'
const prefix = config.PREFIX

export default [
  {
    name: 'joke',
    description: 'Get a random joke',
    category: 'fun',
    handler: async ({ msg, Dave, from }) => {
      try {
        const res = await axios.get('https://official-joke-api.appspot.com/random_joke')
        const joke = `${res.data.setup}\n\n${res.data.punchline}`
        await Dave.sendMessage(from, { text: `🤣 ${joke}` }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: `❌ Failed to fetch joke.` }, { quoted: msg })
      }
    }
  },

  {
    name: 'truth',
    description: 'Get a truth question',
    category: 'fun',
    handler: async ({ msg, Dave, from }) => {
      try {
        const res = await axios.get('https://api.truthordarebot.xyz/v1/truth')
        await Dave.sendMessage(from, { text: `🧐 Truth: ${res.data.question}` }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: `❌ Failed to fetch truth.` }, { quoted: msg })
      }
    }
  },

  {
    name: 'dare',
    description: 'Get a dare challenge',
    category: 'fun',
    handler: async ({ msg, Dave, from }) => {
      try {
        const res = await axios.get('https://api.truthordarebot.xyz/v1/dare')
        await Dave.sendMessage(from, { text: `🎯 Dare: ${res.data.question}` }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: `❌ Failed to fetch dare.` }, { quoted: msg })
      }
    }
  },

  {
    name: 'advice',
    description: 'Get a random life advice',
    category: 'fun',
    handler: async ({ msg, Dave, from }) => {
      try {
        const res = await axios.get('https://api.adviceslip.com/advice')
        await Dave.sendMessage(from, { text: `💡 Advice: ${res.data.slip.advice}` }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: `❌ Failed to fetch advice.` }, { quoted: msg })
      }
    }
  },
  {
    name: 'line',
    description: 'Get a pickup line',
    category: 'fun',
    handler: async ({ msg, Dave, from }) => {
      try {
        const res = await axios.get('https://api.popcat.xyz/v2/pickuplines')
        await Dave.sendMessage(from, { text: `${res.data.message.pickupline}` }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: `❌ Failed to fetch pickup line.` }, { quoted: msg })
      }
    }
  },
  {
    name: 'insult',
    description: 'Get a random insult',
    category: 'fun',
    handler: async ({ msg, Dave, from }) => {
      try {
        const res = await axios.get('https://evilinsult.com/generate_insult.php?lang=en&type=json')
        await Dave.sendMessage(from, { text: `😈 ${res.data.insult}` }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: `❌ Failed to fetch insult.` }, { quoted: msg })
      }
    }
  },

  {
    name: 'meme',
    description: 'Get a random meme',
    category: 'fun',
    handler: async ({ msg, Dave, from }) => {
      try {
        const res = await axios.get('https://meme-api.com/gimme')
        await Dave.sendMessage(from, {
          image: { url: res.data.url },
          caption: `😂 ${res.data.title}`
        }, { quoted: msg })
      } catch {
        await Dave.sendMessage(from, { text: `❌ Failed to fetch meme.` }, { quoted: msg })
      }
    }
  }
]
