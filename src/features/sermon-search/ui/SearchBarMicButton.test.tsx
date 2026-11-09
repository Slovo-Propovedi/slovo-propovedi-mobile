import { fireEvent, render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { SearchBarMicButton } from './SearchBarMicButton'

jest.mock('shared/ui/theme', () => {
  const actual = jest.requireActual('shared/ui/theme')

  return {
    ...actual,
    useTheme: () => ({ currentTheme: actual.LightTheme, isLight: true, themeMode: 'light' }),
  }
})

const MIC_LABEL = 'Голосовой ввод'
const MIC_ICON_SIZE = 22

const getMicGlyphColor = () => {
  const glyph = screen.root?.queryAll(
    instance => StyleSheet.flatten(instance.props.style)?.fontSize === MIC_ICON_SIZE,
  )[0]

  return StyleSheet.flatten(glyph?.props.style)?.color
}

const renderMicButton = async ({
  isListening = false,
  isUnavailable,
}: {
  isListening?: boolean
  isUnavailable?: boolean
} = {}) =>
  render(
    <SearchBarMicButton
      onPress={jest.fn()}
      isListening={isListening}
      isUnavailable={isUnavailable}
    />,
  )

describe('<SearchBarMicButton>', () => {
  test('draws the idle mic with the theme text color', async () => {
    await renderMicButton()

    expect(getMicGlyphColor()).toBe('#000')
  })

  test('draws the unavailable mic with the muted text color', async () => {
    await renderMicButton({ isUnavailable: true })

    expect(getMicGlyphColor()).toBe('#666')
  })

  test('keeps the primary tint while listening even when unavailable', async () => {
    await renderMicButton({ isListening: true, isUnavailable: true })

    expect(getMicGlyphColor()).toBe('#f16031')
  })

  test('keeps the unavailable mic tappable so it can explain itself', async () => {
    const onPress = jest.fn()
    await render(<SearchBarMicButton isUnavailable onPress={onPress} isListening={false} />)

    await fireEvent.press(screen.getByLabelText(MIC_LABEL))

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
