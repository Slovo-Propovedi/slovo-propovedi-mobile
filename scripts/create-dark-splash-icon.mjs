#!/usr/bin/env node

// Generates both splash contour variants from the flat splash art with one alpha
// mask (distance from the flat background): accent (#f16031) for dark backgrounds,
// dark (#474747) for the brand-orange one. Committed and copied byte-for-byte into
// public/; regenerate when assets/splash.png changes. Previews go to /tmp.

import { copyFile, mkdir } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ASSETS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../assets')
const PUBLIC_DIR = resolve(ASSETS_DIR, '../public')
const SOURCE = join(ASSETS_DIR, 'splash.png')
const ACCENT = { b: 49, g: 96, r: 241 } // #f16031
const MARK = { b: 71, g: 71, r: 71 } // #474747

const VARIANTS = [
  {
    output: join(ASSETS_DIR, 'dark-splash-icon.png'), // accent mark on transparent
    preview: process.env.DARK_SPLASH_ICON_PREVIEW ?? '/tmp/opencode/dark-splash-icon-preview.png',
    previewBackground: '#000000',
    rgb: ACCENT,
  },
  {
    output: join(ASSETS_DIR, 'light-splash-icon.png'), // dark mark on transparent
    preview: process.env.LIGHT_SPLASH_ICON_PREVIEW ?? '/tmp/opencode/light-splash-icon-preview.png',
    previewBackground: '#f16031',
    rgb: MARK,
  },
]

const distance = (pixel, other) =>
  Math.hypot(pixel.r - other.r, pixel.g - other.g, pixel.b - other.b)

const clampAlpha = value => Math.min(1, Math.max(0, value))

const readSource = async () => {
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // A background-less source has a transparent corner; masking against it would
  // make every remaining pixel fully opaque and emit a solid colored square.
  if (data[3] !== 255) {
    throw new Error('splash.png corner is not opaque — the source looks already background-less')
  }

  // The splash is a flat background with the mark on top, so the corner pixel is the background.
  const background = { b: data[2], g: data[1], r: data[0] }
  const markDistance = distance(background, MARK)
  if (markDistance === 0) {
    throw new Error('splash mark color matches background — nothing to extract')
  }

  return { background, data, markDistance, size: { height: info.height, width: info.width } }
}

const buildVariant = ({ background, data, markDistance }, rgb) => {
  const output = Buffer.alloc(data.length)

  for (let i = 0; i < data.length; i += 4) {
    const pixel = { b: data[i + 2], g: data[i + 1], r: data[i] }
    const alpha = clampAlpha(distance(pixel, background) / markDistance)
    output[i] = rgb.r
    output[i + 1] = rgb.g
    output[i + 2] = rgb.b
    output[i + 3] = Math.round(alpha * 255)
  }

  return output
}

// Verifies the in-memory RGBA buffer before it is persisted: a transparent corner,
// at least one opaque pixel, and every opaque pixel carrying exactly the variant color.
const verifyVariantBuffer = ({ data, name, rgb }) => {
  if (data[3] !== 0) throw new Error(`${name} corner alpha is ${data[3]} — expected 0`)

  let opaquePixels = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] !== 255) continue

    const isVariantColor = data[i] === rgb.r && data[i + 1] === rgb.g && data[i + 2] === rgb.b
    if (!isVariantColor) throw new Error(`${name} opaque pixel #${i / 4} is off-color`)
    opaquePixels++
  }

  if (opaquePixels === 0) throw new Error(`${name} is fully transparent — no mark extracted`)

  return opaquePixels
}

const writePreview = async ({ output, preview, previewBackground }) => {
  await mkdir(dirname(preview), { recursive: true })
  await sharp(output).flatten({ background: previewBackground }).toFile(preview)
}

const main = async () => {
  const source = await readSource()
  const { height, width } = source.size

  for (const variant of VARIANTS) {
    const name = basename(variant.output)
    const output = buildVariant(source, variant.rgb)
    const opaquePixels = verifyVariantBuffer({ data: output, name, rgb: variant.rgb })

    await sharp(output, { raw: { channels: 4, height, width } })
      .png()
      .toFile(variant.output)
    await copyFile(variant.output, join(PUBLIC_DIR, name))

    const opaqueShare = ((opaquePixels / (width * height)) * 100).toFixed(1)

    await writePreview(variant)

    console.log(`Saved ${variant.output}: ${width}x${height}`)
    console.log(`Opaque pixels: ${opaquePixels} (${opaqueShare}%)`)
    console.log(`Preview: ${variant.preview}`)
  }
}

main().catch(error => {
  console.error(`create-dark-splash-icon failed: ${error.message}`)
  process.exit(1)
})
