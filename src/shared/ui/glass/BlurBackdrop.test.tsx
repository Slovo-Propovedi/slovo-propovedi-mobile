import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Platform, Text } from 'react-native'
import { BlurBackdrop } from './BlurBackdrop'
import { getBlurTarget, unregisterBlurTarget } from './blurTargets'

jest.mock('expo-blur', () => {
  const { forwardRef } = jest.requireActual('react')
  const { View: MockView } = jest.requireActual('react-native')

  return {
    BlurTargetView: forwardRef((props: Record<string, unknown>, ref: unknown) => (
      <MockView {...props} ref={ref} testID='blur-target' />
    )),
  }
})

const setPlatform = (os: 'android' | 'ios', version?: number) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os })
  Object.defineProperty(Platform, 'Version', { configurable: true, value: version })
}

const TARGET_TEST_ID = 'blur-target'

const layoutTarget = async () => {
  await act(async () => fireEvent(screen.getByTestId(TARGET_TEST_ID), 'layout'))
}

afterEach(() => {
  const target = getBlurTarget('/listen')

  if (target) unregisterBlurTarget('/listen', target)

  setPlatform('ios', undefined)
})

describe('<BlurBackdrop>', () => {
  test('registers the page target on Android 12+ once it is laid out', async () => {
    setPlatform('android', 35)

    await render(
      <BlurBackdrop routeKey='/listen'>
        <Text>CONTENT</Text>
      </BlurBackdrop>,
    )
    expect(screen.getByText('CONTENT')).toBeTruthy()
    expect(getBlurTarget('/listen')).toBeNull()

    await layoutTarget()

    expect(getBlurTarget('/listen')).not.toBeNull()
  })

  test('drops the target from the registry on unmount', async () => {
    setPlatform('android', 35)

    const { unmount } = await render(
      <BlurBackdrop routeKey='/listen'>
        <Text>CONTENT</Text>
      </BlurBackdrop>,
    )
    await layoutTarget()

    await act(async () => unmount())

    expect(getBlurTarget('/listen')).toBeNull()
  })

  test('renders children without a target wrapper below Android 12', async () => {
    setPlatform('android', 30)

    await render(
      <BlurBackdrop routeKey='/listen'>
        <Text>CONTENT</Text>
      </BlurBackdrop>,
    )

    expect(screen.getByText('CONTENT')).toBeTruthy()
    expect(screen.queryByTestId(TARGET_TEST_ID)).toBeNull()
  })

  test('renders children without a target wrapper off Android', async () => {
    setPlatform('ios', 35)

    await render(
      <BlurBackdrop routeKey='/listen'>
        <Text>CONTENT</Text>
      </BlurBackdrop>,
    )

    expect(screen.queryByTestId(TARGET_TEST_ID)).toBeNull()
  })
})
