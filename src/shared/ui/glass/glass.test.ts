import { createGlassStyles, getGlassBorder, getGlassFill, getGlassTint, GLASS } from './glass'
import { getWebGlassStyle } from './webGlass'

const BACKDROP_FILTER = 'blur(1px) saturate(140%)'
const LIGHT_FILL = 'rgba(208, 208, 208, 0.85)'
const DARK_FILL = 'rgba(80, 80, 80, 0.7)'
const WEB_DARK_FILL = 'rgba(80, 80, 80, 0.65)'

describe('glass recipe', () => {
  test('keeps a barely-there native blur so the backdrop stays crisp', () => {
    expect(GLASS.blur.intensity).toBe(5)
    expect(GLASS.blur.androidMethod).toBe('dimezisBlurViewSdk31Plus')
  })

  test('uses a dense light-gray fill so the island reads bright but not white', () => {
    expect(getGlassFill(true)).toBe(LIGHT_FILL)
  })

  test('uses a dense dark-gray fill that still reads through', () => {
    expect(getGlassFill(false)).toBe(DARK_FILL)
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
    // Classic recipe, nearly blurless like the native one:
    // `backdrop-filter: blur(1px) saturate(140%)`. The filter is emitted twice —
    // Safari still honours only the `-webkit-` prefixed form.
    expect(GLASS.web.backdropFilter).toBe(BACKDROP_FILTER)

    expect(getWebGlassStyle(true, 16)).toEqual({
      backdropFilter: BACKDROP_FILTER,
      backgroundColor: 'rgba(208, 208, 208, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 16,
      borderWidth: 1,
      WebkitBackdropFilter: BACKDROP_FILTER,
    })
  })

  test('web: dark theme uses a denser tint and a subtler rim', () => {
    expect(getWebGlassStyle(false, 28)).toMatchObject({
      backgroundColor: WEB_DARK_FILL,
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
    expect(getGlassFill(true, GLASS.android.fillAlphaBoost)).toBe('rgba(208, 208, 208, 0.91)')
    expect(getGlassFill(false, GLASS.android.fillAlphaBoost)).toBe('rgba(80, 80, 80, 0.76)')
  })

  test('picks the blur tint that matches the theme', () => {
    expect(getGlassTint(true)).toBe('light')
    expect(getGlassTint(false)).toBe('dark')
  })

  test('builds every layer from the shared recipe for the requested theme and radius', () => {
    expect(createGlassStyles(true, 38)).toEqual({
      blur: { intensity: GLASS.blur.intensity, tint: 'light' },
      containerPlain: {},
      fill: { backgroundColor: LIGHT_FILL },
      rim: { borderColor: 'rgba(255, 255, 255, 0.25)', borderRadius: 38, borderWidth: 1 },
    })
    expect(createGlassStyles(false, 9999)).toMatchObject({
      blur: { intensity: GLASS.blur.intensity, tint: 'dark' },
      containerPlain: {},
      fill: { backgroundColor: DARK_FILL },
      rim: { borderColor: 'rgba(255, 255, 255, 0.12)', borderRadius: 9999, borderWidth: 1 },
    })
  })
})
