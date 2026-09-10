import { act, fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { StudyScreen } from './ui'

jest.mock('./scene-routes', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    FirstRoute: () => <Text>FIRST_SCENE</Text>,
    SecondRoute: () => <Text>SECOND_SCENE</Text>,
  }
})

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
