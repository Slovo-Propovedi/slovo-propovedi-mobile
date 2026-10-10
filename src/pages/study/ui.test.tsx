import { act, fireEvent } from '@testing-library/react-native'
import { useFeatureFlag } from 'entities/feature-flags'
import { renderWithProviders } from 'shared/mocks'
import { StudyScreen } from './ui'

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
