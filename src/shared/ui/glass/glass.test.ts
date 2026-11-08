import {
  createGlassStyles,
  getGlassBorder,
  getGlassFill,
  getGlassTint,
  getWebGlassStyle,
  getWebRefractionStyle,
  GLASS,
} from './glass'

describe('glass recipe', () => {
  test('keeps a moderate native blur so the backdrop stays readable', () => {
    expect(GLASS.blur.intensity).toBe(40)
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

  test('web: uses a moderate blur that keeps the background readable like Apple Music', () => {
    // expo-blur web caps the backdrop at `saturate(180%) blur(intensity * 0.2px)`
    // and cannot express brightness, so the web layer bypasses it with an
    // explicit filter shared by every surface.
    expect(GLASS.web.backdropFilter).toBe('blur(6px) saturate(180%) brightness(1.1)')
    expect(getWebGlassStyle()).toEqual({
      backdropFilter: 'blur(6px) saturate(180%) brightness(1.1)',
    })
  })

  test('web: adds an SVG refraction as a progressive enhancement', () => {
    // The refraction layer carries ONLY the filter reference: it sits under the
    // base-blur layer, so engines that drop `url()` in `backdrop-filter` still
    // show the blur instead of losing the whole glass effect.
    expect(GLASS.web.refractionFilter).toBe('url(#sp-glass-refraction)')
    expect(getWebRefractionStyle()).toEqual({ backdropFilter: 'url(#sp-glass-refraction)' })
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
