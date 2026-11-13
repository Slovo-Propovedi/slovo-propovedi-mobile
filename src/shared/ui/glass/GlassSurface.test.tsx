import { render, screen } from '@testing-library/react-native'
import { type ComponentRef, createRef, type RefObject } from 'react'
import { Platform, StyleSheet, type View } from 'react-native'
import { getGlassBorder, getGlassFill, getWebGlassFill, GLASS } from './glass'
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

const findSheen = () =>
  screen.root?.queryAll(instance => instance.props.colors === GLASS.android.sheen.colors)

const findRim = () =>
  screen.root?.queryAll(instance => {
    const flat = StyleSheet.flatten(instance.props.style)

    return flat?.borderColor === getGlassBorder(true) && flat?.borderWidth === 1
  }) ?? []

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

  test('iOS renders the top-edge sheen as the light-refraction cue', async () => {
    setPlatform('ios')
    await render(<GlassSurface isLight radius={28} />)

    expect(findSheen()).toHaveLength(1)
  })

  test('web renders the top-edge sheen above its glass sheet', async () => {
    setPlatform('web')
    await render(<GlassSurface isLight radius={28} />)

    expect(findSheen()).toHaveLength(1)
  })

  test('web renders one classic glassmorphism sheet above the backdrop', async () => {
    setPlatform('web')
    await render(<GlassSurface isLight radius={28} />)

    expect(findBlur()).toHaveLength(0)

    const glassLayers =
      screen.root?.queryAll(
        instance => StyleSheet.flatten(instance.props.style)?.backdropFilter != null,
      ) ?? []

    expect(glassLayers).toHaveLength(1)

    // One translucent sheet: blur + saturate (standard and Safari-prefixed),
    // theme tint and a 1px rim. No refraction mask, no shadow.
    expect(StyleSheet.flatten(glassLayers[0]?.props.style)).toMatchObject({
      backdropFilter: GLASS.web.backdropFilter,
      backgroundColor: getWebGlassFill(true),
      borderColor: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 28,
      borderWidth: 1,
      WebkitBackdropFilter: GLASS.web.backdropFilter,
    })
  })

  test('android substitutes depth cues for the impossible backdrop blur', async () => {
    setPlatform('android')
    await render(<GlassSurface isLight radius={28} />)

    const blurs = findBlur()

    // The blurred layer darkens slightly so the surface separates from content.
    expect(StyleSheet.flatten(blurs?.[0]?.props.style)).toMatchObject({
      backgroundColor: getGlassFill(true, GLASS.android.fillAlphaBoost),
    })

    const sheen = findSheen()

    expect(sheen).toHaveLength(1)
    expect(StyleSheet.flatten(sheen?.[0]?.props.style)).toMatchObject({
      height: GLASS.android.sheen.heightPercent,
    })
  })

  test('frames every native surface with the hairline rim', async () => {
    setPlatform('android')
    await render(<GlassSurface isLight radius={28} />)

    expect(findRim()).toHaveLength(1)
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

    // Explicit `none` instead of an unset prop: expo-blur logs a warning when a
    // dimezis method is paired with a missing `blurTarget`.
    expect(blurs?.[0]?.props.blurMethod).toBe('none')
    expect(blurs?.[0]?.props.blurTarget).toBeUndefined()
  })

  test('android below 12 never requests the dimezis blur even with a target', async () => {
    setPlatform('android', 30)

    await render(<GlassSurface isLight radius={28} blurTarget={createBlurTarget()} />)

    expect(findBlur()?.[0]?.props.blurMethod).toBe('none')
    expect(findBlur()?.[0]?.props.blurTarget).toBeUndefined()
  })
})
