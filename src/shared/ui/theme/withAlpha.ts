import { type ColorValue } from 'react-native'

interface Rgba {
  alpha: number
  blue: number
  green: number
  red: number
}

const HEX_LENGTHS: Record<number, number> = { 3: 1, 6: 2, 8: 2 }

const parseHex = (hex: string): null | Rgba => {
  const digits = hex.slice(1)
  const step = HEX_LENGTHS[digits.length]

  if (!step) return null

  const channels = []
  for (let index = 0; index < digits.length; index += step)
    channels.push(parseInt(digits.slice(index, index + step), 16))

  if (channels.some(channel => Number.isNaN(channel))) return null

  const [red, green, blue, alpha] = channels
  const scale = step === 1 ? 17 : 1

  return {
    alpha: alpha === undefined ? 1 : alpha / 255,
    blue: blue * scale,
    green: green * scale,
    red: red * scale,
  }
}

const parseRgb = (rgb: string): null | Rgba => {
  const numbers = rgb
    .replace(/^rgba?\(|\)$/g, '')
    .split(',')
    .map(part => Number.parseFloat(part.trim()))

  if (numbers.length < 3) return null

  const [red, green, blue, alpha = 1] = numbers
  if ([red, green, blue, alpha].some(number => Number.isNaN(number))) return null

  return { alpha, blue, green, red }
}

/**
 * Returns a color with the given alpha, for the theme's `primary` when a
 * less intense variant is needed (for example the ON track of a switch whose
 * thumb already carries the full-strength primary).
 *
 * Understands `#rgb`/`#rrggbb`/`#rrggbbaa` and `rgb()`/`rgba()` strings. Values
 * that cannot be reduced to channels (a `PlatformColor` such as Material You's
 * dynamic primary, or a named color) are returned unchanged — there is no way
 * to dim them in JS, and the full color is a safe fallback.
 * @param color - Any theme color value.
 * @param alpha - Target opacity in the 0..1 range.
 */
export const withAlpha = (color: ColorValue, alpha: number): ColorValue => {
  if (typeof color !== 'string') return color

  const rgba = color.startsWith('#')
    ? parseHex(color)
    : color.startsWith('rgb')
      ? parseRgb(color)
      : null

  if (!rgba) return color

  return `rgba(${rgba.red}, ${rgba.green}, ${rgba.blue}, ${alpha})`
}
