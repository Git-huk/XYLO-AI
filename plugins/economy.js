import mongoose from 'mongoose'
import config from '../config.js'

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('✅ Connected to MongoDB for Economy')
  }
}

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  coins: { type: Number, default: 100 },
  lastDailyClaim: { type: Date, default: null },
  lastWork: { type: Date, default: null },
  lastRob: { type: Date, default: null },
})
const User = mongoose.models.User || mongoose.model('User', userSchema)

async function getUser(userId) {
  await connectDB()
  let user = await User.findOne({ userId })
  if (!user) {
    user = new User({ userId })
    await user.save()
  }
  return user
}

async function saveUser(user) {
  await user.save()
}

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000
const WORK_COOLDOWN = 1 * 60 * 60 * 1000  // 1 hour
const ROB_COOLDOWN = 2 * 60 * 60 * 1000   // 2 hours

const CREATOR_ID = '2349133354644@s.whatsapp.net' // Your number

export default [
  {
    name: 'coins',
    description: 'Check your coin balance',
    category: 'economy',
    handler: async ({ msg, from, sender, Dave }) => {
      const user = await getUser(sender)
      await Dave.sendMessage(from, { text: `💰 You have *${user.coins}* coins.` }, { quoted: msg })
    }
  },
  {
    name: 'daily',
    description: 'Claim daily coins (once every 24 hours)',
    category: 'economy',
    handler: async ({ msg, from, sender, Dave }) => {
      const user = await getUser(sender)
      const now = new Date()
      if (user.lastDailyClaim && now - user.lastDailyClaim < DAILY_COOLDOWN) {
        const remainingMs = DAILY_COOLDOWN - (now - user.lastDailyClaim)
        const hours = Math.floor(remainingMs / (1000 * 60 * 60))
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
        return await Dave.sendMessage(from, {
          text: `⏳ You already claimed your daily coins.\nTry again in ${hours}h ${minutes}m.`
        }, { quoted: msg })
      }
      const reward = 500
      user.coins += reward
      user.lastDailyClaim = now
      await saveUser(user)
      await Dave.sendMessage(from, {
        text: `🎉 You claimed *${reward}* daily coins!\nYour new balance: *${user.coins}* coins.`
      }, { quoted: msg })
    }
  },
  {
    name: 'pay',
    description: 'Send coins to another user',
    category: 'economy',
    handler: async ({ msg, args, from, sender, Dave }) => {
      if (args.length < 2) {
        return await Dave.sendMessage(from, {
          text: `Usage:\n${config.PREFIX}pay @user <amount>`
        }, { quoted: msg })
      }
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
      if (!mentioned || mentioned.length === 0) {
        return await Dave.sendMessage(from, { text: '❌ You must mention a user to pay.' }, { quoted: msg })
      }
      const payTo = mentioned[0]
      if (payTo === sender) {
        return await Dave.sendMessage(from, { text: '❌ You cannot pay yourself.' }, { quoted: msg })
      }
      const amount = parseInt(args[1], 10)
      if (isNaN(amount) || amount <= 0) {
        return await Dave.sendMessage(from, { text: '❌ Invalid amount.' }, { quoted: msg })
      }

      const userFrom = await getUser(sender)
      if (userFrom.coins < amount) {
        return await Dave.sendMessage(from, { text: '❌ You do not have enough coins.' }, { quoted: msg })
      }
      const userTo = await getUser(payTo)

      userFrom.coins -= amount
      userTo.coins += amount

      await saveUser(userFrom)
      await saveUser(userTo)

      await Dave.sendMessage(from, {
        text: `✅ Successfully sent *${amount}* coins to @${payTo.split('@')[0]}.\nYour new balance: *${userFrom.coins}* coins.`,
        mentions: [payTo]
      }, { quoted: msg })
    }
  },
  {
    name: 'leaderboard',
    description: 'Show top users by coin balance',
    category: 'economy',
    handler: async ({ from, Dave }) => {
      await connectDB()
      const topUsers = await User.find({}).sort({ coins: -1 }).limit(10)
      if (!topUsers.length) {
        return await Dave.sendMessage(from, { text: 'No users found on leaderboard.' })
      }
      let text = '🏆 Coin Leaderboard:\n\n'
      for (let i = 0; i < topUsers.length; i++) {
        const u = topUsers[i]
        text += `${i + 1}. @${u.userId.split('@')[0]} — *${u.coins}* coins\n`
      }
      await Dave.sendMessage(from, { text, mentions: topUsers.map(u => u.userId) })
    }
  },

  // Fun commands

  {
    name: 'gamble',
    description: 'Gamble your coins (50% chance to double, 50% lose)',
    category: 'economy',
    handler: async ({ msg, args, from, sender, Dave }) => {
      if (args.length < 1) {
        return await Dave.sendMessage(from, { text: `Usage:\n${config.PREFIX}gamble <amount>` }, { quoted: msg })
      }
      const amount = parseInt(args[0], 10)
      if (isNaN(amount) || amount <= 0) {
        return await Dave.sendMessage(from, { text: '❌ Invalid amount.' }, { quoted: msg })
      }

      const user = await getUser(sender)
      if (user.coins < amount) {
        return await Dave.sendMessage(from, { text: '❌ You do not have enough coins to gamble.' }, { quoted: msg })
      }

      const win = Math.random() < 0.5
      if (win) {
        user.coins += amount
        await Dave.sendMessage(from, { text: `🎉 You won! You gained *${amount}* coins.` }, { quoted: msg })
      } else {
        user.coins -= amount
        await Dave.sendMessage(from, { text: `😞 You lost! You lost *${amount}* coins.` }, { quoted: msg })
      }
      await saveUser(user)
    }
  },

  {
    name: 'work',
    description: 'Work to earn coins (1 hour cooldown)',
    category: 'economy',
    handler: async ({ msg, from, sender, Dave }) => {
      const user = await getUser(sender)
      const now = new Date()

      if (user.lastWork && now - user.lastWork < WORK_COOLDOWN) {
        const remainingMs = WORK_COOLDOWN - (now - user.lastWork)
        const minutes = Math.floor(remainingMs / (1000 * 60))
        return await Dave.sendMessage(from, {
          text: `⏳ You are tired. Work again in ${minutes} minute(s).`
        }, { quoted: msg })
      }

      const earn = Math.floor(Math.random() * 300) + 100 // earn 100-399 coins
      user.coins += earn
      user.lastWork = now
      await saveUser(user)

      await Dave.sendMessage(from, {
        text: `💼 You worked hard and earned *${earn}* coins! Your balance is now *${user.coins}* coins.`
      }, { quoted: msg })
    }
  },

  {
    name: 'rob',
    description: 'Rob coins from another user (2 hours cooldown)',
    category: 'economy',
    handler: async ({ msg, args, from, sender, Dave }) => {
      if (args.length < 1) {
        return await Dave.sendMessage(from, { text: `Usage:\n${config.PREFIX}rob @user` }, { quoted: msg })
      }
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
      if (!mentioned || mentioned.length === 0) {
        return await Dave.sendMessage(from, { text: '❌ You must mention a user to rob.' }, { quoted: msg })
      }
      const victimId = mentioned[0]
      if (victimId === sender) {
        return await Dave.sendMessage(from, { text: '❌ You cannot rob yourself.' }, { quoted: msg })
      }

      const user = await getUser(sender)
      const victim = await getUser(victimId)
      const now = new Date()

      if (user.lastRob && now - user.lastRob < ROB_COOLDOWN) {
        const remainingMs = ROB_COOLDOWN - (now - user.lastRob)
        const minutes = Math.floor(remainingMs / (1000 * 60))
        return await Dave.sendMessage(from, {
          text: `⏳ You already robbed recently. Try again in ${minutes} minute(s).`
        }, { quoted: msg })
      }

      if (victim.coins < 100) {
        return await Dave.sendMessage(from, { text: '❌ The victim does not have enough coins to rob.' }, { quoted: msg })
      }

      // Rob between 10% to 50% of victim's coins
      const stolen = Math.floor(victim.coins * (Math.random() * 0.4 + 0.1))

      victim.coins -= stolen
      user.coins += stolen
      user.lastRob = now

      await saveUser(user)
      await saveUser(victim)

      await Dave.sendMessage(from, {
        text: `💰 You robbed @${victimId.split('@')[0]} and stole *${stolen}* coins!`,
        mentions: [victimId]
      }, { quoted: msg })
    }
  },

  // Admin commands
  {
    name: 'addcoins',
    description: 'Add coins to a user (admin only)',
    category: 'economy',
    handler: async ({ msg, args, from, sender, Dave }) => {
      if (sender !== CREATOR_ID) return
      if (args.length < 2) {
        return await Dave.sendMessage(from, { text: `Usage:\n${config.PREFIX}addcoins @user <amount>` }, { quoted: msg })
      }
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
      if (!mentioned || mentioned.length === 0) {
        return await Dave.sendMessage(from, { text: '❌ You must mention a user.' }, { quoted: msg })
      }
      const userId = mentioned[0]
      const amount = parseInt(args[1], 10)
      if (isNaN(amount) || amount <= 0) {
        return await Dave.sendMessage(from, { text: '❌ Invalid amount.' }, { quoted: msg })
      }
      const user = await getUser(userId)
      user.coins += amount
      await saveUser(user)
      await Dave.sendMessage(from, {
        text: `✅ Added *${amount}* coins to @${userId.split('@')[0]}.\nNew balance: *${user.coins}* coins.`,
        mentions: [userId]
      }, { quoted: msg })
    }
  },
  {
    name: 'removecoins',
    description: 'Remove coins from a user (admin only)',
    category: 'economy',
    handler: async ({ msg, args, from, sender, Dave }) => {
      if (sender !== CREATOR_ID) return
      if (args.length < 2) {
        return await Dave.sendMessage(from, { text: `Usage:\n${config.PREFIX}removecoins @user <amount>` }, { quoted: msg })
      }
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
      if (!mentioned || mentioned.length === 0) {
        return await Dave.sendMessage(from, { text: '❌ You must mention a user.' }, { quoted: msg })
      }
      const userId = mentioned[0]
      const amount = parseInt(args[1], 10)
      if (isNaN(amount) || amount <= 0) {
        return await Dave.sendMessage(from, { text: '❌ Invalid amount.' }, { quoted: msg })
      }
      const user = await getUser(userId)
      user.coins = Math.max(0, user.coins - amount)
      await saveUser(user)
      await Dave.sendMessage(from, {
        text: `✅ Removed *${amount}* coins from @${userId.split('@')[0]}.\nNew balance: *${user.coins}* coins.`,
        mentions: [userId]
      }, { quoted: msg })
    }
  },
  {
    name: 'setcoins',
    description: 'Set coins for a user (admin only)',
    category: 'economy',
    handler: async ({ msg, args, from, sender, Dave }) => {
      if (sender !== CREATOR_ID) return
      if (args.length < 2) {
        return await Dave.sendMessage(from, { text: `Usage:\n${config.PREFIX}setcoins @user <amount>` }, { quoted: msg })
      }
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
      if (!mentioned || mentioned.length === 0) {
        return await Dave.sendMessage(from, { text: '❌ You must mention a user.' }, { quoted: msg })
      }
      const userId = mentioned[0]
      const amount = parseInt(args[1], 10)
      if (isNaN(amount) || amount < 0) {
        return await Dave.sendMessage(from, { text: '❌ Invalid amount.' }, { quoted: msg })
      }
        const user = await getUser(userId)
      user.coins = amount
      await saveUser(user)
      await Dave.sendMessage(from, {
        text: `✅ Set coins of @${userId.split('@')[0]} to *${amount}* coins.`,
        mentions: [userId]
      }, { quoted: msg })
    }
  }
]