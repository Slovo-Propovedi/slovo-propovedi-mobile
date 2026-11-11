import { act, fireEvent } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { useFeatureFlag } from 'entities/feature-flags'
import { renderWithProviders } from 'shared/mocks'
import { StudyScreen } from './ui'

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useNavigation: () => ({ addListener: jest.fn() }),
}))

// The real pager issues native commands (`dispatchCommand`) against a host ref
// that never exists in the test renderer. A class component keeps the ref a real
// component instance (Animated resolves its host node) while exposing the same
// imperative API react-native-tab-view's jumpTo/mount paths call.
jest.mock('react-native-pager-view', () => {
  const React = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')

  class MockPagerView extends React.Component<{
    children?: ReactNode
    style?: unknown
  }> {
    public render() {
      return React.createElement(View, { style: this.props.style }, this.props.children)
    }

    public setPage = jest.fn()
    public setPageWithoutAnimation = jest.fn()
  }

  return { __esModule: true, default: MockPagerView }
})

jest.mock('shared/ui', () => {
  const actual = jest.requireActual('shared/ui')
  const { Text } = jest.requireActual('react-native')

  return {
    ...actual,
    BlurBackdrop: ({ children, routeKey }: { children: ReactNode; routeKey: string }) => (
      <>
        <Text>{`BLUR_TARGET:${routeKey}`}</Text>
        {children}
      </>
    ),
  }
})

jest.mock('entities/feature-flags', () => ({ useFeatureFlag: jest.fn() }))

jest.mock('./scene-routes', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    FirstRoute: () => <Text>FIRST_SCENE</Text>,
    SecondRoute: () => <Text>SECOND_SCENE</Text>,
  }
})

const mockedUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>

const FIRST_SCENE_LABEL = 'FIRST_SCENE'
const SECOND_SCENE_LABEL = 'SECOND_SCENE'

// react-native-tab-view's SceneView schedules a setTimeout for unfocused scenes;
// flush it inside act so the state update does not leak outside the test.
const flushTimers = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

describe('<StudyScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseFeatureFlag.mockReturnValue(true)
  })

  test('renders nothing when the study feature flag is disabled', async () => {
    mockedUseFeatureFlag.mockReturnValue(false)

    const { queryByText } = await renderWithProviders(<StudyScreen />)
    await flushTimers()

    expect(queryByText('Богословие')).toBeNull()
    expect(queryByText(FIRST_SCENE_LABEL)).toBeNull()
  })

  test('renders both tab titles', async () => {
    const { getByText } = await renderWithProviders(<StudyScreen />)
    await flushTimers()

    expect(getByText('Богословие')).toBeTruthy()
    expect(getByText('Душепопечение')).toBeTruthy()
  })

  test('exposes the page content as the /study blur backdrop', async () => {
    const { getByText } = await renderWithProviders(<StudyScreen />)
    await flushTimers()

    expect(getByText('BLUR_TARGET:/study')).toBeTruthy()
  })

  test('renders the first scene by default', async () => {
    const { getByText, queryByText } = await renderWithProviders(<StudyScreen />)
    await flushTimers()

    expect(getByText(FIRST_SCENE_LABEL)).toBeTruthy()
    expect(queryByText(SECOND_SCENE_LABEL)).toBeNull()
  })

  test('switches to the second scene when its tab is pressed', async () => {
    const { getByText, queryByText } = await renderWithProviders(<StudyScreen />)
    await flushTimers()

    await fireEvent.press(getByText('Душепопечение'))
    await flushTimers()

    expect(getByText(SECOND_SCENE_LABEL)).toBeTruthy()
    expect(queryByText(FIRST_SCENE_LABEL)).toBeNull()
  })
})
