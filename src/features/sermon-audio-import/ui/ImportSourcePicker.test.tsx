import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { ImportSourcePicker } from './ImportSourcePicker'

const YOUTUBE_LABEL = 'YouTube'
const INVIDIOUS_LABEL = 'Invidious'
const DISABLED_HINT = 'На вебе доступен только источник Invidious'

const mockOnSelect = jest.fn()

const renderPicker = async (source: 'invidious' | 'youtube') =>
  renderWithProviders(<ImportSourcePicker source={source} onSelect={mockOnSelect} />)

const renderDisabledYouTubePicker = async () =>
  renderWithProviders(
    <ImportSourcePicker source='invidious' onSelect={mockOnSelect} disabledSources={['youtube']} />,
  )

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

  test('disables a listed source and exposes the hint', async () => {
    await renderDisabledYouTubePicker()

    expect(screen.getByRole('button', { name: YOUTUBE_LABEL })).toBeDisabled()
    expect(screen.getByHintText(DISABLED_HINT)).toBeTruthy()
    expect(screen.getByRole('button', { name: INVIDIOUS_LABEL })).toBeSelected()
  })

  test('does not report a disabled source when tapped', async () => {
    await renderDisabledYouTubePicker()

    fireEvent.press(screen.getByRole('button', { name: YOUTUBE_LABEL }))

    expect(mockOnSelect).not.toHaveBeenCalled()
  })
})
