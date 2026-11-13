import { act, render, screen } from '@testing-library/react-native'
import { type ComponentRef, createRef } from 'react'
import { Platform, type View } from 'react-native'
import { BlurTargetProvider } from './BlurTargetProvider'
import { type BlurTargetRef, registerBlurTarget, unregisterBlurTarget } from './blurTargets'
import { GLASS } from './glass'
import { GlassSurface } from './GlassSurface'

const mockUsePathname = jest.fn(() => '/listen')

jest.mock('expo-router', () => ({ usePathname: () => mockUsePathname() }))

jest.mock('expo-linear-gradient', () => {
  const { View: MockView } = jest.requireActual('react-native')

  return { LinearGradient: (props: Record<string, unknown>) => <MockView {...props} /> }
})

const createTargetRef = (): BlurTargetRef => createRef<ComponentRef<typeof View>>()

const setPlatform = (os: 'android' | 'ios', version?: number) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os })
  Object.defineProperty(Platform, 'Version', { configurable: true, value: version })
}

const findBlur = () =>
  screen.root?.queryAll(instance => instance.props.intensity === GLASS.blur.intensity)

let registeredTarget: BlurTargetRef | null = null

afterEach(() => {
  if (registeredTarget) unregisterBlurTarget('/listen', registeredTarget)

  registeredTarget = null
  setPlatform('ios', undefined)
})

describe('<BlurTargetProvider>', () => {
  test('publishes the active page target to the glass surfaces below it', async () => {
    setPlatform('android', 35)
    const target = createTargetRef()
    registeredTarget = target

    await render(
      <BlurTargetProvider>
        <GlassSurface isLight radius={28} />
      </BlurTargetProvider>,
    )
    expect(findBlur()?.[0]?.props.blurMethod).toBe('none')

    await act(async () => registerBlurTarget('/listen', target))

    expect(findBlur()?.[0]?.props.blurMethod).toBe(GLASS.blur.androidMethod)
    expect(findBlur()?.[0]?.props.blurTarget).toBe(target)
  })

  test('an explicit null opts the surface out of the provider target', async () => {
    setPlatform('android', 35)
    const target = createTargetRef()
    registeredTarget = target

    await render(
      <BlurTargetProvider>
        <GlassSurface isLight radius={28} blurTarget={null} />
      </BlurTargetProvider>,
    )
    await act(async () => registerBlurTarget('/listen', target))

    // Used by surfaces floating over the page (the mini pill): they resolve
    // their own page target instead of inheriting the chrome shade.
    expect(findBlur()?.[0]?.props.blurMethod).toBe('none')
    expect(findBlur()?.[0]?.props.blurTarget).toBeUndefined()
  })
})
