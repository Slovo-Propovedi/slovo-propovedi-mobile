import { createGlassStyles, getGlassBorder, getGlassFill, getGlassTint, GLASS } from './glass'

describe('glass recipe', () => {
  test('keeps the blur strong enough to frost arbitrary content behind it', () => {
    expect(GLASS.blur.intensity).toBe(60)
    expect(GLASS.blur.androidMethod).toBe('dimezisBlurViewSdk31Plus')
  })

  test('uses a translucent light fill so the blurred backdrop shows through', () => {
    expect(getGlassFill(true)).toBe('rgba(255, 255, 255, 0.45)')
  })

  test('uses a translucent dark fill so the blurred backdrop shows through', () => {
    expect(getGlassFill(false)).toBe('rgba(0, 0, 0, 0.35)')
  })

  test('draws a white hairline rim in both themes', () => {
    expect(getGlassBorder(true)).toBe('rgba(255, 255, 255, 0.25)')
    expect(getGlassBorder(false)).toBe('rgba(255, 255, 255, 0.12)')
  })

  test('floats each island on one subtle shadow', () => {
    expect(GLASS.shadow.boxShadow).toBe('0px 5px 14px rgba(0, 0, 0, 0.25)')
  })

  test('picks the blur tint that matches the theme', () => {
    expect(getGlassTint(true)).toBe('light')
    expect(getGlassTint(false)).toBe('dark')
  })

  test('builds every layer from the shared recipe for the requested theme and radius', () => {
    expect(createGlassStyles(true, 38)).toEqual({
      blur: { intensity: GLASS.blur.intensity, tint: 'light' },
      container: { boxShadow: GLASS.shadow.boxShadow },
      fill: { backgroundColor: 'rgba(255, 255, 255, 0.45)' },
      rim: { borderColor: 'rgba(255, 255, 255, 0.25)', borderRadius: 38, borderWidth: 1 },
    })
    expect(createGlassStyles(false, 9999)).toMatchObject({
      blur: { intensity: GLASS.blur.intensity, tint: 'dark' },
      fill: { backgroundColor: 'rgba(0, 0, 0, 0.35)' },
      rim: { borderColor: 'rgba(255, 255, 255, 0.12)', borderRadius: 9999, borderWidth: 1 },
    })
  })
})
