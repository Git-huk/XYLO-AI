import fs from 'fs'
import { spawn } from 'child_process'
import path from 'path'
import * as FileType from 'file-type'

const fileTypeFromBuffer = FileType.fileTypeFromBuffer || FileType.default?.fileTypeFromBuffer

const tempDir = './tmp'
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

function getTmp(ext = '') {
  return path.join(tempDir, `${Date.now()}_${Math.floor(Math.random() * 9999)}${ext}`)
}

export async function writeExif(buffer, options = {}) {
  const type = await fileTypeFromBuffer(buffer)
  if (!type) throw new Error('Unsupported file type')

  const input = getTmp(`.${type.ext}`)
  const json = getTmp('.json')
  const output = getTmp('_exif.webp')

  fs.writeFileSync(input, buffer)

  const stickerPack = {
    'sticker-pack-id': 'xylo-md',
    'sticker-pack-name': options.packname || 'XYLO',
    'sticker-pack-publisher': options.author || 'Xylo Team',
    emojis: options.categories || ['🔥']
  }

  fs.writeFileSync(json, JSON.stringify(stickerPack))

  await new Promise((res, rej) => {
    spawn('webpmux', ['-set', 'exif', json, input, '-o', output])
      .on('exit', code => code === 0 ? res() : rej(new Error('Failed to add EXIF')))
  })

  const result = fs.readFileSync(output)
  for (const file of [input, json, output]) fs.unlinkSync(file)
  return result
}

export async function imageToWebp(media) {
  const input = getTmp('.jpg')
  const output = getTmp('.webp')
  fs.writeFileSync(input, media)

  await new Promise((res, rej) => {
    spawn('ffmpeg', [
      '-i', input,
      '-vcodec', 'libwebp',
      '-filter:v', 'fps=15',
      '-lossless', '1',
      '-compression_level', '6',
      '-qscale', '90',
      '-preset', 'default',
      '-loop', '0',
      '-an', '-vsync', '0',
      output
    ]).on('exit', code => code === 0 ? res() : rej(new Error('Failed to convert image to WebP')))
  })

  const buffer = fs.readFileSync(output)
  fs.unlinkSync(input)
  fs.unlinkSync(output)
  return buffer
}

export async function videoToWebp(media) {
  const input = getTmp('.mp4')
  const output = getTmp('.webp')
  fs.writeFileSync(input, media)

  await new Promise((res, rej) => {
    spawn('ffmpeg', [
      '-i', input,
      '-vcodec', 'libwebp',
      '-vf', 'scale=320:320:force_original_aspect_ratio=decrease,fps=15',
      '-lossless', '1',
      '-compression_level', '6',
      '-qscale', '90',
      '-preset', 'default',
      '-loop', '0',
      '-an', '-vsync', '0',
      output
    ]).on('exit', code => code === 0 ? res() : rej(new Error('Failed to convert video to WebP')))
  })

  const buffer = fs.readFileSync(output)
  fs.unlinkSync(input)
  fs.unlinkSync(output)
  return buffer
}

export { writeExif as writeExifImg, writeExif as writeExifVid }