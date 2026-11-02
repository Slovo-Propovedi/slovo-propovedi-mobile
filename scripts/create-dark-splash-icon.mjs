#!/usr/bin/env node

// Generates the splash accent mark from the flat splash art: keeps the
// dark #474747 mark, re-colors it with the brand accent (#f16031) and makes
// everything else transparent, so it reads on the black dark-theme background
// (cold-start splash and OTA reload screen). The output is committed —
// regenerate when assets/splash.png changes. Every run also writes a
// white-background QA preview to /tmp (not committed).

import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ASSETS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../assets')
const SOURCE = join(ASSETS_DIR, 'splash.png')
const OUTPUT = join(ASSETS_DIR, 'dark-splash-icon.png')
const PREVIEW = process.env.DARK_SPLASH_ICON_PREVIEW ?? '/tmp/opencode/dark-splash-icon-preview.png'
const ACCENT = { b: 49, g: 96, r: 241 } // #f16031
const MARK = { b: 71, g: 71, r: 71 } // #474747

const distance = (pixel, other) =>
  Math.hypot(pixel.r - other.r, pixel.g - other.g, pixel.b - other.b)

const clampAlpha = value => Math.min(1, Math.max(0, value))

const accentizeSplash = async () => {
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

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

  return { output, size: { height: info.height, width: info.width } }
}

const countOpaquePixels = async () => {
  const { data } = await sharp(OUTPUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let opaquePixels = 0
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] === 255) opaquePixels++
  }
  return opaquePixels
}

const verifyOutput = async () => {
  const { height, width } = await sharp(OUTPUT).metadata()
  if (!width || !height) {
    throw new Error(`dark-splash-icon.png has no dimensions (width: ${width}, height: ${height})`)
  }

  const opaquePixels = await countOpaquePixels()
  if (opaquePixels === 0) {
    throw new Error('dark-splash-icon.png is fully transparent — the mark was not extracted')
  }

  return { height, opaquePixels, width }
}

const writePreview = async () => {
  await mkdir(dirname(PREVIEW), { recursive: true })
  await sharp(OUTPUT).flatten({ background: '#ffffff' }).toFile(PREVIEW)
}

const main = async () => {
  const { output, size } = await accentizeSplash()

  await sharp(output, { raw: { channels: 4, height: size.height, width: size.width } })
    .png()
    .toFile(OUTPUT)

  const { height, opaquePixels, width } = await verifyOutput()
  const opaqueShare = ((opaquePixels / (width * height)) * 100).toFixed(1)

  await writePreview()

  console.log(`Saved ${OUTPUT}: ${width}x${height}`)
  console.log(`Opaque pixels: ${opaquePixels} (${opaqueShare}%)`)
  console.log(`Preview: ${PREVIEW}`)
}

main().catch(error => {
  console.error(`create-dark-splash-icon failed: ${error.message}`)
  process.exit(1)
})
