import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { ImportSourcePicker } from './ImportSourcePicker'

const YOUTUBE_LABEL = 'YouTube'
const INVIDIOUS_LABEL = 'Invidious'

const mockOnSelect = jest.fn()

const renderPicker = async (source: 'invidious' | 'youtube') =>
  renderWithProviders(<ImportSourcePicker source={source} onSelect={mockOnSelect} />)

describe('<ImportSourcePicker>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders both sources', async () => {
    await renderPicker('invidious')

    expect(screen.getByRole('button', { name: YOUTUBE_LABEL })).toBeTruthy()
    expect(screen.getByRole('button', { name: INVIDIOUS_LABEL })).toBeTruthy()
  })

  test('marks the selected source', async () => {
    await renderPicker('invidious')

    expect(screen.getByRole('button', { name: INVIDIOUS_LABEL })).toBeSelected()
    expect(screen.getByRole('button', { name: YOUTUBE_LABEL })).not.toBeSelected()
  })

  test('reports the tapped source', async () => {
    await renderPicker('invidious')

    fireEvent.press(screen.getByRole('button', { name: YOUTUBE_LABEL }))

    expect(mockOnSelect).toHaveBeenCalledWith('youtube')
  })
})
