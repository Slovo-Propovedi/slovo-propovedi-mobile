import { fireEvent, render } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { TimecodedText } from './TimecodedText'

const TARGETED_TIMECODE_LABEL = 'Перейти к 5:00'
const TARGETED_TIMECODE_MS = 300_000

const styles = StyleSheet.create({
  text: { color: '#fff' },
  timecode: { color: '#f16031' },
})

const mockOnTimecodePress = jest.fn()

describe('<TimecodedText>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders a timecode as a link labelled with its target', async () => {
    const { getByRole } = await render(
      <TimecodedText
        style={styles.text}
        timecodeStyle={styles.timecode}
        text='Слушайте с 5:00 внимательно'
        onTimecodePress={mockOnTimecodePress}
      />,
    )

    expect(getByRole('link', { name: TARGETED_TIMECODE_LABEL })).toBeTruthy()
  })

  test('pressing a timecode reports the parsed position', async () => {
    const { getByRole } = await render(
      <TimecodedText text='Слушайте с 5:00 внимательно' onTimecodePress={mockOnTimecodePress} />,
    )

    await fireEvent.press(getByRole('link', { name: TARGETED_TIMECODE_LABEL }))

    expect(mockOnTimecodePress).toHaveBeenCalledWith(TARGETED_TIMECODE_MS)
  })

  test('renders plain text without timecodes as non-interactive content', async () => {
    const { getByText, queryByRole } = await render(
      <TimecodedText text='Просто описание без меток' onTimecodePress={mockOnTimecodePress} />,
    )

    expect(getByText('Просто описание без меток')).toBeTruthy()
    expect(queryByRole('link')).toBeNull()
  })
})
