import {
  createGlassStyles,
  getGlassBorder,
  getGlassFill,
  getGlassTint,
  getWebGlassStyle,
  GLASS,
} from './glass'

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

  test('web: replaces the weak expo-blur output with a stronger backdrop filter', () => {
    // expo-blur web caps at `saturate(180%) blur(intensity * 0.2px)`, which reads
    // flat next to the Apple Music glass. The web layer bypasses it with an
    // explicit, stronger filter shared by every surface.
    expect(GLASS.web.backdropFilter).toBe('blur(18px) saturate(200%)')
    expect(getWebGlassStyle()).toEqual({ backdropFilter: 'blur(18px) saturate(200%)' })
  })

  test('android: adds a top-edge sheen and a stronger fill instead of a blur', () => {
    expect(GLASS.android.sheen.colors).toEqual([
      'rgba(255, 255, 255, 0.10)',
      'rgba(255, 255, 255, 0)',
    ])
    expect(GLASS.android.sheen.heightPercent).toBe('40%')
    expect(getGlassFill(true, GLASS.android.fillAlphaBoost)).toBe('rgba(255, 255, 255, 0.51)')
    expect(getGlassFill(false, GLASS.android.fillAlphaBoost)).toBe('rgba(0, 0, 0, 0.41)')
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
