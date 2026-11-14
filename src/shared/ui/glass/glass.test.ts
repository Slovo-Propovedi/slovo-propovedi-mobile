import { createGlassStyles, getGlassBorder, getGlassFill, getGlassTint, GLASS } from './glass'
import { getWebGlassStyle } from './webGlass'

describe('glass recipe', () => {
  test('keeps a moderate native blur so the backdrop stays readable', () => {
    expect(GLASS.blur.intensity).toBe(40)
    expect(GLASS.blur.androidMethod).toBe('dimezisBlurViewSdk31Plus')
  })

  test('uses a translucent light fill so the blurred backdrop shows through', () => {
    expect(getGlassFill(true)).toBe('rgba(255, 255, 255, 0.38)')
  })

  test('uses a translucent dark fill so the blurred backdrop shows through', () => {
    expect(getGlassFill(false)).toBe('rgba(0, 0, 0, 0.26)')
  })

  test('draws a white hairline rim in both themes', () => {
    expect(getGlassBorder(true)).toBe('rgba(255, 255, 255, 0.25)')
    expect(getGlassBorder(false)).toBe('rgba(255, 255, 255, 0.12)')
  })

  test('every island host is shadowless', () => {
    // The shared `BarBackdropShade` gradient, not a box shadow, carries depth.
    const styles = createGlassStyles(true, 38)

    expect(styles.containerPlain).toEqual({})
  })

  test('web: classic glassmorphism blurs and saturates the backdrop', () => {
    // Classic recipe: `backdrop-filter: blur(12px) saturate(140%)`. The filter is
    // emitted twice — Safari still honours only the `-webkit-` prefixed form.
    expect(GLASS.web.backdropFilter).toBe('blur(12px) saturate(140%)')

    expect(getWebGlassStyle(true, 16)).toEqual({
      backdropFilter: 'blur(12px) saturate(140%)',
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      borderColor: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 16,
      borderWidth: 1,
      WebkitBackdropFilter: 'blur(12px) saturate(140%)',
    })
  })

  test('web: dark theme uses a denser tint and a subtler rim', () => {
    expect(getWebGlassStyle(false, 28)).toMatchObject({
      backgroundColor: 'rgba(0, 0, 0, 0.22)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 28,
      borderWidth: 1,
    })
  })

  test('android: adds a top-edge sheen and a stronger fill instead of a blur', () => {
    expect(GLASS.android.sheen.colors).toEqual([
      'rgba(255, 255, 255, 0.14)',
      'rgba(255, 255, 255, 0)',
    ])
    expect(GLASS.android.sheen.heightPercent).toBe('40%')
    expect(getGlassFill(true, GLASS.android.fillAlphaBoost)).toBe('rgba(255, 255, 255, 0.44)')
    expect(getGlassFill(false, GLASS.android.fillAlphaBoost)).toBe('rgba(0, 0, 0, 0.32)')
  })

  test('picks the blur tint that matches the theme', () => {
    expect(getGlassTint(true)).toBe('light')
    expect(getGlassTint(false)).toBe('dark')
  })

  test('builds every layer from the shared recipe for the requested theme and radius', () => {
    expect(createGlassStyles(true, 38)).toEqual({
      blur: { intensity: GLASS.blur.intensity, tint: 'light' },
      containerPlain: {},
      fill: { backgroundColor: 'rgba(255, 255, 255, 0.38)' },
      rim: { borderColor: 'rgba(255, 255, 255, 0.25)', borderRadius: 38, borderWidth: 1 },
    })
    expect(createGlassStyles(false, 9999)).toMatchObject({
      blur: { intensity: GLASS.blur.intensity, tint: 'dark' },
      containerPlain: {},
      fill: { backgroundColor: 'rgba(0, 0, 0, 0.26)' },
      rim: { borderColor: 'rgba(255, 255, 255, 0.12)', borderRadius: 9999, borderWidth: 1 },
    })
  })
})
