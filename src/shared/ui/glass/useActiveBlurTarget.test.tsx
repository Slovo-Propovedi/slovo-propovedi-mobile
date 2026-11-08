import { act, render, screen } from '@testing-library/react-native'
import { type ComponentRef, createRef } from 'react'
import { Platform, Text, type View } from 'react-native'
import {
  type BlurTargetRef,
  getBlurTarget,
  registerBlurTarget,
  unregisterBlurTarget,
} from './blurTargets'
import { useActiveBlurTarget } from './useActiveBlurTarget'

const mockUsePathname = jest.fn(() => '/listen')

jest.mock('expo-router', () => ({ usePathname: () => mockUsePathname() }))

const createTargetRef = (): BlurTargetRef => createRef<ComponentRef<typeof View>>()

const Probe = () => {
  const target = useActiveBlurTarget()

  return <Text>{target ? 'TARGET' : 'NONE'}</Text>
}

const setPlatform = (os: 'android' | 'ios', version?: number) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os })
  Object.defineProperty(Platform, 'Version', { configurable: true, value: version })
}

afterEach(() => {
  const registered = getBlurTarget('/listen')

  if (registered) unregisterBlurTarget('/listen', registered)

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
