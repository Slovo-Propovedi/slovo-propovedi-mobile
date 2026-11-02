#!/usr/bin/env node

// Generates the OTA reload-screen logo from the flat splash art: keeps the
// dark #474747 mark, re-colors it with the brand accent (#f16031) and makes
// everything else transparent, so expo-updates can draw it over the themed
// background. The output is committed — regenerate when assets/splash.png changes.

import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ASSETS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../assets')
const SOURCE = join(ASSETS_DIR, 'splash.png')
const OUTPUT = join(ASSETS_DIR, 'reload-screen-icon.png')
const ACCENT = { b: 49, g: 96, r: 241 } // #f16031
const MARK = { b: 71, g: 71, r: 71 } // #474747

const distance = (pixel, other) => Math.hypot(pixel.r - other.r, pixel.g - other.g, pixel.b - other.b)

const clampAlpha = (value) => Math.min(1, Math.max(0, value))

const main = async () => {
  const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  // The splash is a flat background with the mark on top, so the corner pixel is the background.
  const background = { b: data[2], g: data[1], r: data[0] }
  const markDistance = distance(background, MARK)
  const output = Buffer.alloc(data.length)

  for (let i = 0; i < data.length; i += 4) {
    const pixel = { b: data[i + 2], g: data[i + 1], r: data[i] }
    const alpha = clampAlpha(distance(pixel, background) / markDistance)
    output[i] = ACCENT.r
    output[i + 1] = ACCENT.g
    output[i + 2] = ACCENT.b
    output[i + 3] = Math.round(alpha * 255)
  }

  await sharp(output, { raw: { channels: 4, height: info.height, width: info.width } })
    .png()
    .toFile(OUTPUT)

  const { isOpaque } = await sharp(OUTPUT).stats()
  let opaquePixels = 0
  for (let i = 3; i < output.length; i += 4) {
    if (output[i] === 255) opaquePixels++
  }

  const totalPixels = info.width * info.height
  console.log(`Saved ${OUTPUT}: ${info.width}x${info.height}, isOpaque: ${isOpaque}`)
  console.log(`Opaque pixels: ${opaquePixels} (${((opaquePixels / totalPixels) * 100).toFixed(1)}%)`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
