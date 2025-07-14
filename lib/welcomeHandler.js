import fs from 'fs'

const groupDBPath = './lib/group.json'
const warnDBPath = './lib/warn.json'

function loadDB(path) {
  return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {}
}

function saveDB(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

export async function handleGroupParticipantsUpdate(Dave, update) {
  const db = loadDB(groupDBPath)
  const groupId = update.id
  const metadata = await Dave.groupMetadata(groupId)
  const groupName = metadata.subject
  const groupConfig = db[groupId] || {}

  for (const participant of update.participants) {
    const userTag = `@${participant.split('@')[0]}`
    const actor = update.author
    const actorTag = actor ? `@${actor.split('@')[0]}` : ''
    const profile = await Dave.profilePictureUrl(participant, 'image').catch(() => null)

    if (update.action === 'add' && groupConfig.welcome) {
      const msg = groupConfig.welcomeMsg
        .replace(/@user/g, userTag)
        .replace(/@group/g, groupName)

      if (msg.includes('@pp') && profile) {
        await Dave.sendMessage(groupId, {
          image: { url: profile },
          caption: msg.replace(/@pp/g, '')
        }, { mentions: [participant] })
      } else {
        await Dave.sendMessage(groupId, { text: msg }, { mentions: [participant] })
      }
    }

    if (update.action === 'remove' && groupConfig.goodbye) {
      const msg = groupConfig.goodbyeMsg
        .replace(/@user/g, userTag)
        .replace(/@group/g, groupName)

      if (msg.includes('@pp') && profile) {
        await Dave.sendMessage(groupId, {
          image: { url: profile },
          caption: msg.replace(/@pp/g, '')
        }, { mentions: [participant] })
      } else {
        await Dave.sendMessage(groupId, { text: msg }, { mentions: [participant] })
      }
    }

    if (update.action === 'promote' && groupConfig.adminEvent) {
      await Dave.sendMessage(groupId, {
        text: `👑 ${userTag} has been *promoted* by ${actorTag}.`,
        mentions: [participant, actor]
      })
    }

    if (update.action === 'demote' && groupConfig.adminEvent) {
      await Dave.sendMessage(groupId, {
        text: `🪶 ${userTag} has been *demoted* by ${actorTag}.`,
        mentions: [participant, actor]
      })
    }
  }
}
