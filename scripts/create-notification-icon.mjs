#!/usr/bin/env node
import sharp from 'sharp'

const SOURCE = 'assets/adaptive-icon.png'
const OUTPUT = 'assets/notification-icon.png'
const SIZE = 96
const DARK_THRESHOLD = 220 // pixels with r+g+b < this and visible are the dark figure

async function main() {
  console.log(`Loading source: ${SOURCE}`)

  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  console.log(`Source: ${info.width}x${info.height}, ${info.channels} channels`)

  // Process each pixel: dark figure → white, everything else → transparent
  const output = Buffer.alloc(data.length)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    const brightness = r + g + b

    if (a > 128 && brightness < DARK_THRESHOLD) {
      // Dark figure pixel → white silhouette
      output[i] = 255     // R
      output[i + 1] = 255 // G
      output[i + 2] = 255 // B
      output[i + 3] = 255 // A (fully opaque)
    } else {
      // Orange or transparent → transparent
      output[i] = 0
      output[i + 1] = 0
      output[i + 2] = 0
      output[i + 3] = 0
    }
  }

  // Create the image from raw data and resize
  await sharp(output, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .resize(SIZE, SIZE, {
      fit: 'contain',
      kernel: 'lanczos3',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(OUTPUT)

  // Verify output
  const resultMeta = await sharp(OUTPUT).metadata()
  console.log(`\nOutput saved: ${OUTPUT}`)
  console.log(`Dimensions: ${resultMeta.width}x${resultMeta.height}`)
  console.log(`Format: ${resultMeta.format}`)
  console.log(`Has alpha: ${resultMeta.hasAlpha ? 'yes' : 'no'}`)
  console.log(`Channels: ${resultMeta.channels}`)

  // Check how many non-transparent pixels we got
  const resultData = await sharp(OUTPUT)
    .ensureAlpha()
    .raw()
    .toBuffer()

  let opaqueCount = 0
  for (let i = 3; i < resultData.length; i += 4) {
    if (resultData[i] > 128) opaqueCount++
  }

  const totalPixels = SIZE * SIZE
  console.log(`Opaque (white) pixels in result: ${opaqueCount} (${(opaqueCount / totalPixels * 100).toFixed(1)}%)`)
}

main().catch(console.error)
