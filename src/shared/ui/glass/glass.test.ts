import { createGlassStyles, getGlassBorder, getGlassFill, getGlassTint, GLASS } from './glass'
import { getWebGlassStyle, getWebRefractionStyle } from './webGlass'

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

  test('keeps the shadow recipe for surfaces outside the bar complex', () => {
    // The bottom islands use the shadowless `containerPlain`: one gradient shade,
    // not a box shadow, carries their depth.
    expect(GLASS.shadow.boxShadow).toBe('0px 5px 14px rgba(0, 0, 0, 0.25)')
    // While a morph owns a surface the wrapper drops the shadow entirely.
    expect(GLASS.shadow.degraded).toBe('none')
  })

  test('web: keeps the base blur shallow so the glass center stays readable', () => {
    // expo-blur web caps the backdrop at `saturate(180%) blur(intensity * 0.2px)`
    // and cannot express brightness, so the web layer bypasses it with an
    // explicit filter shared by every surface. 4px blurs mildly without turning
    // the center into mush; the edge ring carries the refraction instead.
    expect(GLASS.web.backdropFilter).toBe('blur(4px) saturate(180%) brightness(1.1)')
    expect(getWebGlassStyle()).toEqual({
      backdropFilter: 'blur(4px) saturate(180%) brightness(1.1)',
    })
  })

  test('web: confines the strong refraction to an edge ring mask', () => {
    // The SVG filter is declared once in public/index.html with the stronger
    // displacement scale. The CSS mask keeps it outside the center: four edge
    // ramps (10px) are additive, so the middle of the island stays clean while
    // the perimeter bends the backdrop like thick glass.
    expect(GLASS.web.edgeRingWidth).toBe(10)
    expect(GLASS.web.refractionFilter).toBe('url(#sp-glass-refraction)')

    const style = getWebRefractionStyle()

    expect(style.backdropFilter).toBe('url(#sp-glass-refraction)')
    expect(style.maskImage).toContain('linear-gradient(to right, #000 0, transparent 10px)')
    expect(style.maskImage).toContain('linear-gradient(to left, #000 0, transparent 10px)')
    expect(style.maskImage).toContain('linear-gradient(to bottom, #000 0, transparent 10px)')
    expect(style.maskImage).toContain('linear-gradient(to top, #000 0, transparent 10px)')
    expect(style.WebkitMaskImage).toBe(style.maskImage)
    expect(style.maskComposite).toBe('add')
    expect(style.WebkitMaskComposite).toBe('source-over')
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
      containerDegraded: { boxShadow: GLASS.shadow.degraded },
      containerPlain: {},
      fill: { backgroundColor: 'rgba(255, 255, 255, 0.45)' },
      rim: { borderColor: 'rgba(255, 255, 255, 0.25)', borderRadius: 38, borderWidth: 1 },
    })
    expect(createGlassStyles(false, 9999)).toMatchObject({
      blur: { intensity: GLASS.blur.intensity, tint: 'dark' },
      containerPlain: {},
      fill: { backgroundColor: 'rgba(0, 0, 0, 0.35)' },
      rim: { borderColor: 'rgba(255, 255, 255, 0.12)', borderRadius: 9999, borderWidth: 1 },
    })
  })
})
