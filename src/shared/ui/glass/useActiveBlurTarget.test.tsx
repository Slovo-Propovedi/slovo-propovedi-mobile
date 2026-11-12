import { act, render, screen } from '@testing-library/react-native'
import { type ComponentRef, createRef } from 'react'
import { Platform, Text, type View } from 'react-native'
import {
  type BlurTargetRef,
  BOTTOM_CHROME_SHADE_KEY,
  getBlurTarget,
  registerBlurTarget,
  unregisterBlurTarget,
} from './blurTargets'
import { useActiveBlurTarget } from './useActiveBlurTarget'
import { usePageBlurTarget } from './usePageBlurTarget'

const mockUsePathname = jest.fn(() => '/listen')

jest.mock('expo-router', () => ({ usePathname: () => mockUsePathname() }))

const createTargetRef = (): BlurTargetRef => createRef<ComponentRef<typeof View>>()

const Probe = ({
  shadeTarget,
  useTarget = useActiveBlurTarget,
}: {
  shadeTarget?: BlurTargetRef
  useTarget?: typeof useActiveBlurTarget
}) => {
  const target = useTarget()
  const value = target === null ? 'NONE' : target === shadeTarget ? 'SHADE' : 'TARGET'

  return <Text>{value}</Text>
}

const setPlatform = (os: 'android' | 'ios', version?: number) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os })
  Object.defineProperty(Platform, 'Version', { configurable: true, value: version })
}

afterEach(() => {
  const registered = getBlurTarget('/listen')

  if (registered) unregisterBlurTarget('/listen', registered)

  const shade = getBlurTarget(BOTTOM_CHROME_SHADE_KEY)

  if (shade) unregisterBlurTarget(BOTTOM_CHROME_SHADE_KEY, shade)

  mockUsePathname.mockReturnValue('/listen')
  setPlatform('ios', undefined)
})

describe('useActiveBlurTarget', () => {
  test('resolves the target registered for the current pathname', async () => {
    setPlatform('android', 35)
    const target = createTargetRef()

    await render(<Probe />)
    expect(screen.getByText('NONE')).toBeTruthy()

    await act(async () => registerBlurTarget('/listen', target))
    expect(screen.getByText('TARGET')).toBeTruthy()

    await act(async () => unregisterBlurTarget('/listen', target))
    expect(screen.getByText('NONE')).toBeTruthy()
  })

  test('resolves the shade target over the page target while the search page is open', async () => {
    setPlatform('android', 35)
    const pageTarget = createTargetRef()
    const shadeTarget = createTargetRef()

    await render(<Probe shadeTarget={shadeTarget} />)
    await act(async () => {
      registerBlurTarget('/listen', pageTarget)
      registerBlurTarget(BOTTOM_CHROME_SHADE_KEY, shadeTarget)
    })

    expect(screen.getByText('SHADE')).toBeTruthy()

    await act(async () => {
      unregisterBlurTarget(BOTTOM_CHROME_SHADE_KEY, shadeTarget)
    })

    expect(screen.getByText('TARGET')).toBeTruthy()

    await act(async () => {
      unregisterBlurTarget('/listen', pageTarget)
    })
  })

  test('page target ignores the chrome shade target', async () => {
    setPlatform('android', 35)
    const pageTarget = createTargetRef()
    const shadeTarget = createTargetRef()

    await render(<Probe shadeTarget={shadeTarget} useTarget={usePageBlurTarget} />)
    await act(async () => {
      registerBlurTarget('/listen', pageTarget)
      registerBlurTarget(BOTTOM_CHROME_SHADE_KEY, shadeTarget)
    })

    // Surfaces floating over the page (the mini pill) must frost the page even
    // while the chrome samples its own shade.
    expect(screen.getByText('TARGET')).toBeTruthy()

    await act(async () => {
      unregisterBlurTarget('/listen', pageTarget)
      unregisterBlurTarget(BOTTOM_CHROME_SHADE_KEY, shadeTarget)
    })
  })

  test('ignores targets of other routes', async () => {
    setPlatform('android', 35)
    const target = createTargetRef()

    await render(<Probe />)
    await act(async () => registerBlurTarget('/more', target))

    expect(screen.getByText('NONE')).toBeTruthy()

    await act(async () => unregisterBlurTarget('/more', target))
  })

  test('stays empty on Android below 12 even when a target is registered', async () => {
    setPlatform('android', 30)

    await render(<Probe />)
    await act(async () => registerBlurTarget('/listen', createTargetRef()))

    expect(screen.getByText('NONE')).toBeTruthy()
  })

  test('stays empty off Android', async () => {
    setPlatform('ios', 35)

    await render(<Probe />)
    await act(async () => registerBlurTarget('/listen', createTargetRef()))

    expect(screen.getByText('NONE')).toBeTruthy()
  })
})
