import fs from 'fs'
import os from 'os'
import path from 'path'
import axios from 'axios'
import FormData from 'form-data'
import { getMediaFromMsg } from '../lib/getMedia.js'

export default [
  {
    name: 'tourl',
    description: 'Convert media to Catbox URL',
    category: 'utility',
    usage: '.tourl [reply to media]',
    handler: async ({ msg, Dave, from, reply }) => {
      try {
        // Use your helper to get media buffer reliably
        const buffer = await getMediaFromMsg(msg)

        if (!buffer || buffer.length === 0) return reply('⚠️ Failed to download media.')

        // Use file-type to detect extension (optional)
        let extension = ''
        const mime = msg.quoted?.message
          ? Object.values(msg.quoted.message)[0]?.mimetype || ''
          : ''

        if (mime.includes('jpeg')) extension = '.jpg'
        else if (mime.includes('png')) extension = '.png'
        else if (mime.includes('gif')) extension = '.gif'
        else if (mime.includes('mp4')) extension = '.mp4'
        else if (mime.includes('mpeg') || mime.includes('mp3')) extension = '.mp3'
        else if (mime.includes('ogg')) extension = '.ogg'
        else if (mime.includes('webp')) extension = '.webp'

        // Create temp file path
        const tempFilePath = path.join(os.tmpdir(), `catbox_upload_${Date.now()}${extension}`)

        await fs.promises.writeFile(tempFilePath, buffer)

        // Prepare form data for upload
        const form = new FormData()
        form.append('fileToUpload', fs.createReadStream(tempFilePath))
        form.append('reqtype', 'fileupload')

        // Upload to Catbox
        const response = await axios.post('https://catbox.moe/user/api.php', form, {
          headers: form.getHeaders()
        })

        // Delete temp file
        await fs.promises.unlink(tempFilePath)

        if (!response.data || typeof response.data !== 'string' || !response.data.includes('https://')) {
          return reply('❌ Failed to upload file to Catbox.')
        }

        // Format size
        function formatBytes(bytes) {
          if (bytes === 0) return '0 Bytes'
          const k = 1024
          const sizes = ['Bytes', 'KB', 'MB', 'GB']
          const i = Math.floor(Math.log(bytes) / Math.log(k))
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
        }

        // Determine media type string for reply
        let mediaType = 'File'
        if (mime.startsWith('image')) mediaType = 'Image'
        else if (mime.startsWith('video')) mediaType = 'Video'
        else if (mime.startsWith('audio')) mediaType = 'Audio'

        await reply(
          `*${mediaType} Uploaded Successfully*\n\n` +
          `*Size:* ${formatBytes(buffer.length)}\n` +
          `*URL:* ${response.data}\n\n` +
          '> © Uploaded by David X'
        )
      } catch (err) {
        console.error('Upload command error:', err)
        reply(`❌ Error: ${err.message || err}`)
      }
    }
  }
]