import fs from 'fs'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { tmpdir } from 'os'
import fileTypeFromBuffer from 'file-type'
import { exec } from 'child_process'
import { promisify } from 'util'
import axios from 'axios'
import webp from 'node-webpmux'
import sizeOf from 'image-size'

const execPromise = promisify(exec)

export async function getBuffer(url, config = {}) {
  const res = await axios.get(url, { ...config, responseType: 'arraybuffer' })
  return res.data
}

export async function getSizeMedia(buffer) {
  const type = await fileTypeFromBuffer(buffer)
  if (!type || !type.mime.startsWith('image/')) return { width: 0, height: 0 }
  // Directly use the synchronous sizeOf here since it works with buffer
  const dimensions = sizeOf(buffer)
  return dimensions
}

export async function imageToWebp(media) {
  const tmpInput = path.join(tmpdir(), `${Date.now()}.jpg`)
  const tmpOutput = path.join(tmpdir(), `${Date.now()}.webp`)
  fs.writeFileSync(tmpInput, media)
  await new Promise((resolve, reject) => {
    ffmpeg(tmpInput)
      .outputOptions([
        '-vcodec', 'libwebp',
        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15',
        '-lossless', '1',
        '-compression_level', '6',
        '-qscale', '80',
        '-preset', 'default',
        '-an', '-vsync', '0'
      ])
      .toFormat('webp')
      .save(tmpOutput)
      .on('end', resolve)
      .on('error', reject)
  })
  return fs.readFileSync(tmpOutput)
}

export async function videoToWebp(media) {
  const tmpInput = path.join(tmpdir(), `${Date.now()}.mp4`)
  const tmpOutput = path.join(tmpdir(), `${Date.now()}.webp`)
  fs.writeFileSync(tmpInput, media)
  await new Promise((resolve, reject) => {
    ffmpeg(tmpInput)
      .outputOptions([
        '-vcodec', 'libwebp',
        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15',
        '-lossless', '1',
        '-compression_level', '6',
        '-qscale', '80',
        '-preset', 'default',
        '-loop', '0',
        '-an', '-vsync', '0'
      ])
      .toFormat('webp')
      .save(tmpOutput)
      .on('end', resolve)
      .on('error', reject)
  })
  return fs.readFileSync(tmpOutput)
}

export async function writeExifImg(media, metadata = {}) {
  const tmpPath = path.join(tmpdir(), `${Date.now()}.webp`)
  fs.writeFileSync(tmpPath, media)
  const img = new webp.Image()
  await img.load(tmpPath)
  img.exif = createExif(metadata)
  await img.save(tmpPath)
  return fs.readFileSync(tmpPath)
}

export async function writeExifVid(media, metadata = {}) {
  const webpBuffer = await videoToWebp(media)
  return await writeExifImg(webpBuffer, metadata)
}

function createExif(pack = {}) {
  const defaultExif = {
    "sticker-pack-id": "com.xylo.stickers",
    "sticker-pack-name": pack.packname || "XYLO-MD Pack",
    "sticker-pack-publisher": pack.author || "XYLO-MD Bot",
    emojis: pack.emojis || ["🌟"]
  }
  const json = Buffer.from(JSON.stringify(defaultExif), 'utf-8')
  const len = Buffer.alloc(2)
  len.writeUInt16BE(json.length, 0)
  return Buffer.concat([Buffer.from([0x49, 0x49, 0x2A, 0x00]), len, json])
}