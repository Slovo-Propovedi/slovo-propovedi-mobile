import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { DescriptionWithTimecodes } from './DescriptionWithTimecodes'

const mockSeekTo = jest.fn().mockResolvedValue(undefined)

jest.mock('entities/player', () => ({
  usePlayer: () => ({ seekTo: mockSeekTo }),
}))

const DESCRIPTION = 'Проповедь начнётся с 5:00, основная часть — на 23:30.'
const FIRST_TIMECODE_LABEL = 'Перейти к 5:00'
const FIRST_TIMECODE_MS = 300_000
const SECOND_TIMECODE_LABEL = 'Перейти к 23:30'
const SECOND_TIMECODE_MS = 1_410_000

const renderDescription = (description = DESCRIPTION) =>
  renderWithProviders(<DescriptionWithTimecodes description={description} />)

describe('<DescriptionWithTimecodes>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSeekTo.mockResolvedValue(undefined)
  })

  test('renders a timecode as a link labelled with its target', async () => {
    const { getByRole, getByText } = await renderDescription()

    expect(getByText('5:00')).toBeTruthy()
    expect(getByRole('link', { name: FIRST_TIMECODE_LABEL })).toBeTruthy()
    expect(getByRole('link', { name: SECOND_TIMECODE_LABEL })).toBeTruthy()
  })

  test('pressing a timecode seeks to the parsed position', async () => {
    const { getByRole } = await renderDescription()

    await fireEvent.press(getByRole('link', { name: FIRST_TIMECODE_LABEL }))

    expect(mockSeekTo).toHaveBeenCalledWith(FIRST_TIMECODE_MS)
  })

  test('pressing another timecode seeks to its own position', async () => {
    const { getByRole } = await renderDescription()

    await fireEvent.press(getByRole('link', { name: SECOND_TIMECODE_LABEL }))

    expect(mockSeekTo).toHaveBeenCalledWith(SECOND_TIMECODE_MS)
  })

  test('renders plain text without timecodes as non-interactive content', async () => {
    const { getByText, queryByRole } = await renderDescription('Просто текст без таймкодов.')

    expect(getByText('Просто текст без таймкодов.')).toBeTruthy()
    expect(queryByRole('link')).toBeNull()
  })
})
