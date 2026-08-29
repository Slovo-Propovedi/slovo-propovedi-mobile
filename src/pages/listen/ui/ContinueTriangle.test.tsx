import { StyleSheet } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { FONT_SIZES } from 'shared/ui/theme'
import { ContinueTriangle } from './ContinueTriangle'

jest.mock('react-native-svg', () => {
  const { View } = jest.requireActual('react-native')

  return {
    __esModule: true,
    default: (props: object) => <View {...props} />,
    Path: (props: object) => <View {...props} />,
  }
})

jest.mock('shared/ui', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    MarqueeText: ({ text }: { text: string }) => <Text>{text}</Text>,
  }
})

const CHOOSE_SERMON_LABEL = 'выберите проповедь'

describe('<ContinueTriangle>', () => {
  test('renders the label', async () => {
    const { getByText } = await renderWithProviders(
      <ContinueTriangle title={null} label='Начать слушать' />,
    )

    expect(getByText('Начать слушать')).toBeTruthy()
  })

  test('renders "выберите проповедь" when no title is given', async () => {
    const { getByText } = await renderWithProviders(
      <ContinueTriangle title={null} label='Начать слушать' />,
    )

    expect(getByText(CHOOSE_SERMON_LABEL)).toBeTruthy()
  })

  test('renders the sermon title in a marquee when a title is given', async () => {
    const { getByText } = await renderWithProviders(
      <ContinueTriangle label='Продолжить' title='Проповедь о вере' />,
    )

    expect(getByText('Продолжить')).toBeTruthy()
    expect(getByText('Проповедь о вере')).toBeTruthy()
  })

  test('renders the main label at lg size', async () => {
    const { getByText } = await renderWithProviders(
      <ContinueTriangle title={null} label='Продолжить' />,
    )

    const label = getByText('Продолжить')
    const flattened = StyleSheet.flatten(label.props.style)
    expect(flattened.fontSize).toBe(FONT_SIZES.lg)
  })
})
