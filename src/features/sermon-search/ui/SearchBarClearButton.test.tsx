import { fireEvent, render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { SearchBarClearButton } from './SearchBarClearButton'

jest.mock('shared/ui/theme', () => {
  const actual = jest.requireActual('shared/ui/theme')

  return {
    ...actual,
    useTheme: () => ({ currentTheme: actual.LightTheme, isLight: true, themeMode: 'light' }),
  }
})

const CLEAR_LABEL = 'Очистить'
const CLEAR_ICON_SIZE = 28

const findClearGlyph = () =>
  screen.root?.queryAll(
    instance => StyleSheet.flatten(instance.props.style)?.fontSize === CLEAR_ICON_SIZE,
  )[0]

describe('<SearchBarClearButton>', () => {
  test('draws the inline clear chip at the enlarged size', async () => {
    await render(<SearchBarClearButton onPress={jest.fn()} />)

    expect(findClearGlyph()).toBeDefined()
  })

  test('calls the query-clearing handler on press', async () => {
    const onPress = jest.fn()
    await render(<SearchBarClearButton onPress={onPress} />)

    await fireEvent.press(screen.getByLabelText(CLEAR_LABEL))

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
