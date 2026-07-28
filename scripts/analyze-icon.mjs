#!/usr/bin/env node
import sharp from 'sharp'

const FILES = [
  'assets/adaptive-icon.png',
  'assets/icon.png',
]

async function analyzeImage(filePath) {
  console.log(`\n=== Analyzing: ${filePath} ===`)

  const metadata = await sharp(filePath).metadata()
  console.log(`Dimensions: ${metadata.width}x${metadata.height}`)
  console.log(`Format: ${metadata.format}`)
  console.log(`Has alpha: ${metadata.hasAlpha ? 'yes' : 'no'}`)
  console.log(`Channels: ${metadata.channels}`)

  // Get raw pixel data
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const width = info.width
  const height = info.height
  const pixels = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      pixels.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        a: data[idx + 3],
      })
    }
  }

  // Corner pixels
  const corners = [
    ['top-left (0,0)', pixels[0]],
    ['top-right', pixels[width - 1]],
    ['bottom-left', pixels[(height - 1) * width]],
    ['bottom-right', pixels[height * width - 1]],
  ]

  console.log('\nCorner pixels:')
  for (const [label, p] of corners) {
    console.log(`  ${label}: rgba(${p.r},${p.g},${p.b},${p.a})`)
  }

  // Center region sample (5x5 average)
  const cx = Math.floor(width / 2)
  const cy = Math.floor(height / 2)
  let sumR = 0, sumG = 0, sumB = 0, sumA = 0, count = 0

  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const idx = ((cy + dy) * width + (cx + dx)) * 4
      if (idx >= 0 && idx < data.length) {
        sumR += data[idx]
        sumG += data[idx + 1]
        sumB += data[idx + 2]
        sumA += data[idx + 3]
        count++
      }
    }
  }

  console.log(`\nCenter region (${cx},${cy}) 5x5 average:`)
  console.log(`  rgba(${Math.round(sumR / count)},${Math.round(sumG / count)},${Math.round(sumB / count)},${Math.round(sumA / count)})`)

  // Center pixel
  const centerIdx = (cy * width + cx) * 4
  console.log(`Center pixel (${cx},${cy}): rgba(${data[centerIdx]},${data[centerIdx + 1]},${data[centerIdx + 2]},${data[centerIdx + 3]})`)

  // Unique color count (downsampled by 4 bits for speed)
  const colorSet = new Set()
  const brightSet = new Set()

  for (let i = 0; i < pixels.length; i += 4) { // sample every 4th pixel
    const p = pixels[i]
    // Quantize to 8 levels per channel
    const key = `${p.r >> 5},${p.g >> 5},${p.b >> 5},${p.a >> 7}`
    colorSet.add(key)
    brightSet.add(p.a > 128 ? (p.r + p.g + p.b) >> 5 : 'transparent')
  }

  console.log(`\nApproximate unique colors (sampled, quantized): ${colorSet.size}`)

  // Brightness histogram
  const bins = { dark: 0, mid: 0, bright: 0, transparent: 0 }

  for (const p of pixels) {
    if (p.a < 128) {
      bins.transparent++
    } else {
      const brightness = p.r + p.g + p.b
      if (brightness < 200) bins.dark++
      else if (brightness < 500) bins.mid++
      else bins.bright++
    }
  }

  const total = pixels.length
  console.log('\nBrightness histogram (alpha > 0.5 = visible):')
  console.log(`  Dark (sum<200):     ${bins.dark} (${(bins.dark / total * 100).toFixed(1)}%)`)
  console.log(`  Mid (200-499):      ${bins.mid} (${(bins.mid / total * 100).toFixed(1)}%)`)
  console.log(`  Bright (500+):      ${bins.bright} (${(bins.bright / total * 100).toFixed(1)}%)`)
  console.log(`  Transparent:        ${bins.transparent} (${(bins.transparent / total * 100).toFixed(1)}%)`)

  // Sample orange-like pixels near #f16031
  const orange = { r: 0xf1, g: 0x60, b: 0x31 }
  const orangeTolerance = 60
  const orangePixels = pixels.filter(p =>
    p.a > 128 &&
    Math.abs(p.r - orange.r) < orangeTolerance &&
    Math.abs(p.g - orange.g) < orangeTolerance &&
    Math.abs(p.b - orange.b) < orangeTolerance
  )

  console.log(`\nPixels near orange (#f16031 ±${orangeTolerance}): ${orangePixels.length}`)
  if (orangePixels.length > 0) {
    const avg = orangePixels.reduce((acc, p) => ({
      r: acc.r + p.r / orangePixels.length,
      g: acc.g + p.g / orangePixels.length,
      b: acc.b + p.b / orangePixels.length,
      a: acc.a + p.a / orangePixels.length,
    }), { r: 0, g: 0, b: 0, a: 0 })
    console.log(`  Average: rgba(${Math.round(avg.r)},${Math.round(avg.g)},${Math.round(avg.b)},${Math.round(avg.a)})`)
  }

  // Sample dark pixels (the figure silhouette candidates)
  const darkPixels = pixels.filter(p =>
    p.a > 128 && (p.r + p.g + p.b) < 200
  )

  console.log(`\nDark pixels (sum<200, visible): ${darkPixels.length}`)
  if (darkPixels.length > 0) {
    const avg = darkPixels.reduce((acc, p) => ({
      r: acc.r + p.r / darkPixels.length,
      g: acc.g + p.g / darkPixels.length,
      b: acc.b + p.b / darkPixels.length,
      a: acc.a + p.a / darkPixels.length,
    }), { r: 0, g: 0, b: 0, a: 0 })
    console.log(`  Average: rgba(${Math.round(avg.r)},${Math.round(avg.g)},${Math.round(avg.b)},${Math.round(avg.a)})`)
  }
}

async function main() {
  for (const file of FILES) {
    try {
      await analyzeImage(file)
    } catch (err) {
      console.error(`Error analyzing ${file}:`, err.message)
    }
  }
}

main().catch(console.error)
