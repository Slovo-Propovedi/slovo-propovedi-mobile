import { render, screen } from '@testing-library/react-native'
import { type ComponentRef, createRef, type RefObject } from 'react'
import { Platform, StyleSheet, type View } from 'react-native'
import { getGlassBorder, getGlassFill, GLASS } from './glass'
import { GlassSurface } from './GlassSurface'

jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native')

  return { LinearGradient: (props: Record<string, unknown>) => <View {...props} /> }
})

const setPlatform = (os: 'android' | 'ios' | 'web', version?: number) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os })
  Object.defineProperty(Platform, 'Version', { configurable: true, value: version })
}

const createBlurTarget = () =>
  createRef<ComponentRef<typeof View>>() as RefObject<ComponentRef<typeof View> | null>

const findBlur = () =>
  screen.root?.queryAll(instance => instance.props.intensity === GLASS.blur.intensity)

afterEach(() => setPlatform('ios'))

describe('<GlassSurface>', () => {
  test('iOS keeps the native BlurView under the shared fill', async () => {
    setPlatform('ios')
    await render(<GlassSurface isLight radius={28} />)

    const blurs = findBlur()

    expect(blurs).toHaveLength(1)
    expect(StyleSheet.flatten(blurs?.[0]?.props.style)).toMatchObject({
      backgroundColor: getGlassFill(true),
    })
  })

  test('web layers a masked edge-refraction ring over the readable base blur', async () => {
    setPlatform('web')
    await render(<GlassSurface isLight radius={28} />)

    expect(findBlur()).toHaveLength(0)

    const layersWithFilter = (filter: string) =>
      screen.root?.queryAll(
        instance => StyleSheet.flatten(instance.props.style)?.backdropFilter === filter,
      ) ?? []

    const baseLayers = layersWithFilter(GLASS.web.backdropFilter)
    const refractionLayers = layersWithFilter(GLASS.web.refractionFilter)

    expect(baseLayers).toHaveLength(1)
    expect(refractionLayers).toHaveLength(1)

    // The base layer owns the fill and the shallow blur; the refraction ring is
    // above it so the displacement bends the already-blurred backdrop. The pair
    // stays split, keeping the plain-blur fallback when `url()` is unsupported.
    expect(StyleSheet.flatten(baseLayers[0]?.props.style)).toMatchObject({
      backgroundColor: getGlassFill(true),
    })
    expect(StyleSheet.flatten(refractionLayers[0]?.props.style)).toMatchObject({
      maskComposite: 'add',
      maskImage: expect.stringContaining('transparent 10px'),
    })
    expect(StyleSheet.flatten(refractionLayers[0]?.props.style).backgroundColor).toBeUndefined()

    const orderedFilters =
      screen.root
        ?.queryAll(instance => StyleSheet.flatten(instance.props.style)?.backdropFilter)
        .map(instance => StyleSheet.flatten(instance.props.style).backdropFilter) ?? []

    expect(orderedFilters).toEqual([GLASS.web.backdropFilter, GLASS.web.refractionFilter])
  })

  test('android substitutes depth cues for the impossible backdrop blur', async () => {
    setPlatform('android')
    await render(<GlassSurface isLight radius={28} />)

    const blurs = findBlur()

    // The blurred layer darkens slightly so the surface separates from content.
    expect(StyleSheet.flatten(blurs?.[0]?.props.style)).toMatchObject({
      backgroundColor: getGlassFill(true, GLASS.android.fillAlphaBoost),
    })

    const sheen = screen.root?.queryAll(
      instance => instance.props.colors === GLASS.android.sheen.colors,
    )

    expect(sheen).toHaveLength(1)
    expect(StyleSheet.flatten(sheen?.[0]?.props.style)).toMatchObject({
      height: GLASS.android.sheen.heightPercent,
    })
  })

  test('android 12+ blurs the registered page backdrop with dimezis', async () => {
    setPlatform('android', 35)
    const blurTarget = createBlurTarget()

    await render(<GlassSurface isLight radius={28} blurTarget={blurTarget} />)

    const blurs = findBlur()

    expect(blurs?.[0]?.props.blurMethod).toBe(GLASS.blur.androidMethod)
    expect(blurs?.[0]?.props.blurTarget).toBe(blurTarget)
  })

  test('android 12+ keeps the tint while no page target is registered yet', async () => {
    setPlatform('android', 35)

    await render(<GlassSurface isLight radius={28} />)

    const blurs = findBlur()

    expect(blurs?.[0]?.props.blurMethod).toBeUndefined()
    expect(blurs?.[0]?.props.blurTarget).toBeUndefined()
  })

  test('android below 12 never requests the dimezis blur even with a target', async () => {
    setPlatform('android', 30)

    await render(<GlassSurface isLight radius={28} blurTarget={createBlurTarget()} />)

    expect(findBlur()?.[0]?.props.blurMethod).toBeUndefined()
    expect(findBlur()?.[0]?.props.blurTarget).toBeUndefined()
  })

  test('degraded swaps the native blur for the plain tint', async () => {
    setPlatform('android', 35)

    await render(<GlassSurface isLight degraded radius={28} blurTarget={createBlurTarget()} />)

    // No native blur is mounted while a morph owns the surface.
    expect(findBlur()).toHaveLength(0)

    const fills =
      screen.root?.queryAll(
        instance =>
          StyleSheet.flatten(instance.props.style)?.backgroundColor ===
          getGlassFill(true, GLASS.android.fillAlphaBoost),
      ) ?? []

    expect(fills).toHaveLength(1)
    // The hairline rim still frames the degrade fallback.
    expect(
      screen.root?.queryAll(instance => {
        const flat = StyleSheet.flatten(instance.props.style)

        return flat?.borderColor === getGlassBorder(true) && flat?.borderWidth === 1
      }),
    ).toHaveLength(1)
  })

  test('web keeps its cheap backdrop blur even when degraded', async () => {
    setPlatform('web')

    await render(<GlassSurface isLight degraded radius={28} />)

    expect(findBlur()).toHaveLength(0)
    expect(
      screen.root?.queryAll(
        instance =>
          StyleSheet.flatten(instance.props.style)?.backdropFilter === GLASS.web.backdropFilter,
      ),
    ).toHaveLength(1)
  })
})
