import { type ColorValue, Platform } from 'react-native'
import { withAlpha } from './withAlpha'

describe('withAlpha', () => {
  test('appends alpha to a 6-digit hex color', () => {
    expect(withAlpha('#f16031', 0.35)).toBe('rgba(241, 96, 49, 0.35)')
  })

  test('expands a 3-digit hex color', () => {
    expect(withAlpha('#abc', 0.5)).toBe('rgba(170, 187, 204, 0.5)')
  })

  test('replaces the alpha of an 8-digit hex color', () => {
    expect(withAlpha('#f1603180', 0.35)).toBe('rgba(241, 96, 49, 0.35)')
  })

  test('replaces the alpha of an rgb() color', () => {
    expect(withAlpha('rgb(241, 96, 49)', 0.4)).toBe('rgba(241, 96, 49, 0.4)')
  })

  test('replaces the alpha of an rgba() color', () => {
    expect(withAlpha('rgba(241, 96, 49, 0.9)', 0.3)).toBe('rgba(241, 96, 49, 0.3)')
  })

  test('returns a non-string color value unchanged', () => {
    const platformColor = Platform.select({ android: 'red', default: 'blue' }) as ColorValue

    expect(withAlpha(platformColor, 0.35)).toBe(platformColor)
  })

  test('returns a named color string unchanged', () => {
    expect(withAlpha('red', 0.35)).toBe('red')
  })

  test('returns a malformed hex string unchanged', () => {
    expect(withAlpha('#zzzzzz', 0.35)).toBe('#zzzzzz')
  })
})
