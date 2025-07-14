import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { tmpdir } from 'os'
import Crypto from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export async function fetchGif(url) {
  const res = await axios.get(url)
  return res.data?.url || null
}

export async function gifToVideo(gifUrl) {
  const id = Crypto.randomBytes(6).toString('hex')
  const gifPath = path.join(tmpdir(), `${id}.gif`)
  const mp4Path = path.join(tmpdir(), `${id}.mp4`)

  const gifBuffer = (await axios.get(gifUrl, { responseType: 'arraybuffer' })).data
  fs.writeFileSync(gifPath, gifBuffer)

  await new Promise((resolve, reject) => {
    ffmpeg(gifPath)
      .outputOptions(['-movflags faststart', '-pix_fmt yuv420p', '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2'])
      .on('end', resolve)
      .on('error', reject)
      .save(mp4Path)
  })

  const videoBuffer = fs.readFileSync(mp4Path)
  fs.unlinkSync(gifPath)
  fs.unlinkSync(mp4Path)
  return videoBuffer
}