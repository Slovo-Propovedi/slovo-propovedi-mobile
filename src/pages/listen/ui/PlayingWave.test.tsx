import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { PlayingWave } from './PlayingWave'

const CONTAINER_TEST_ID = 'playing-wave'
const WAVE_TEST_ID = 'playing-wave-path'
const CONTAINER_WIDTH = 160
const CONTAINER_HEIGHT = 40

const layoutEvent = (width: number, height: number) => ({
  nativeEvent: { layout: { height, width, x: 0, y: 0 } },
})

describe('<PlayingWave>', () => {
  test('does not render the wave before the container is measured', async () => {
    const { getByTestId, queryByTestId } = await renderWithProviders(<PlayingWave />)

    expect(getByTestId(CONTAINER_TEST_ID)).toBeTruthy()
    expect(queryByTestId(WAVE_TEST_ID)).toBeNull()
  })

  test('renders the wave once the container width and height are known', async () => {
    const { getByTestId } = await renderWithProviders(<PlayingWave />)

    await fireEvent(
      getByTestId(CONTAINER_TEST_ID),
      'layout',
      layoutEvent(CONTAINER_WIDTH, CONTAINER_HEIGHT),
    )

    expect(getByTestId(WAVE_TEST_ID)).toBeTruthy()
  })

  test('keeps the wave viewBox within the container height (no peak clipping)', async () => {
    const { getByTestId } = await renderWithProviders(<PlayingWave />)

    await fireEvent(
      getByTestId(CONTAINER_TEST_ID),
      'layout',
      layoutEvent(CONTAINER_WIDTH, CONTAINER_HEIGHT),
    )

    const svg = screen.root?.queryAll(instance => typeof instance.props?.vbHeight === 'number')[0]

    expect(svg?.props.vbHeight).toBe(CONTAINER_HEIGHT)
  })
})
