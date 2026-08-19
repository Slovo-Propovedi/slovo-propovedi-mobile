import { screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { AnimatedSoundBars } from './AnimatedSoundBars'

const BAR_COUNT = 3

describe('<AnimatedSoundBars>', () => {
  test('renders three animated bars', async () => {
    await renderWithProviders(<AnimatedSoundBars />)

    const bars = screen.getAllByTestId(/^sound-bar-/)
    expect(bars).toHaveLength(BAR_COUNT)
  })

  test('renders without requiring props', async () => {
    const { toJSON } = await renderWithProviders(<AnimatedSoundBars />)

    expect(toJSON()).toBeTruthy()
  })
})
