// plugin/antidelete.js
import { getConfig, setConfig } from '../lib/configdb.js'

const MODES = {
  1: 'inbox',
  2: 'same',
  3: 'off'
}

function menu(currentMode) {
  return `*Antidelete Menu*\n
Current mode: *${currentMode}*

Reply with the number to set mode:
1. Forward deleted messages to *bot inbox*
2. Forward deleted messages to *same chat* where deleted
3. Turn *off* antidelete (ignore deleted messages)`
}

export default [{
  name: 'antidelete',
  description: 'Toggle antidelete feature',

  async handler({ msg, args, from, sender, Dave, isOwner }) {
    if (!isOwner) {
      await Dave.sendMessage(from, {
        text: '❌ Only the bot owner can change antidelete settings.'
      }, { quoted: msg })
      return
    }

    // Handle reply input
    const userInput =
      args[0] ||
      msg.message?.extendedTextMessage?.text?.trim() || // reply message text
      null

    if (!userInput) {
      const currentMode = await getConfig('antidelete_mode') || 'off'
      await Dave.sendMessage(from, {
        text: menu(currentMode)
      }, { quoted: msg })
      return
    }

    if (!['1', '2', '3'].includes(userInput)) {
      await Dave.sendMessage(from, {
        text: '❌ Invalid choice. Please reply 1, 2, or 3.'
      }, { quoted: msg })
      return
    }

    const newMode = MODES[userInput]
    await setConfig('antidelete_mode', newMode)

    let replyText = ''
    if (newMode === 'inbox') {
      replyText = '✅ Antidelete is now set to forward deleted messages to the *bot inbox*.'
    } else if (newMode === 'same') {
      replyText = '✅ Antidelete is now set to forward deleted messages to the *same chat* where deleted.'
    } else {
      replyText = '✅ Antidelete is now *OFF*. Deleted messages will be ignored.'
    }

    await Dave.sendMessage(from, { text: replyText }, { quoted: msg })
  }
}]