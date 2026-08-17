#!/usr/bin/env node
import sharp from 'sharp'

const SOURCE = 'assets/icon.png'
const OUTPUT = 'assets/fallback-artwork.png'
const BACKGROUND = '#f16031' // COLORS.primary — fills transparent margins and rounded corners

async function main() {
  console.log(`Loading source: ${SOURCE}`)

  const sourceMeta = await sharp(SOURCE).metadata()
  console.log(
    `Source: ${sourceMeta.width}x${sourceMeta.height}, ${sourceMeta.channels} channels, alpha: ${sourceMeta.hasAlpha ? 'yes' : 'no'}`,
  )

  // Flatten transparent margins and rounded corners onto the brand orange background
  await sharp(SOURCE)
    .flatten({ background: BACKGROUND })
    .png()
    .toFile(OUTPUT)

  // Verify output
  const resultMeta = await sharp(OUTPUT).metadata()
  console.log(`\nOutput saved: ${OUTPUT}`)
  console.log(`Dimensions: ${resultMeta.width}x${resultMeta.height}`)
  console.log(`Format: ${resultMeta.format}`)
  console.log(`Has alpha: ${resultMeta.hasAlpha ? 'yes' : 'no'}`)
  console.log(`Channels: ${resultMeta.channels}`)

  // Check corners are now opaque orange (full-frame, no transparent rounded corners)
  const { data, info } = await sharp(OUTPUT)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const corners = [
    ['top-left', 0],
    ['top-right', info.width - 1],
    ['bottom-left', (info.height - 1) * info.width],
    ['bottom-right', info.height * info.width - 1],
  ]

  console.log('\nCorner pixels:')
  for (const [label, idx] of corners) {
    const offset = idx * 4
    const r = data[offset]
    const g = data[offset + 1]
    const b = data[offset + 2]
    const a = data[offset + 3]
    console.log(`  ${label}: rgba(${r},${g},${b},${a})`)
  }

  let nonOpaqueCount = 0
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) nonOpaqueCount++
  }

  const totalPixels = info.width * info.height
  console.log(`\nNon-opaque pixels: ${nonOpaqueCount} (${(nonOpaqueCount / totalPixels * 100).toFixed(1)}%)`)
  console.log(nonOpaqueCount === 0 ? 'Result: full-frame, no alpha' : 'Result: WARNING — alpha still present')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})