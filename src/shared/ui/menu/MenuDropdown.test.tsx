import { act, fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import type { TestInstance } from 'test-renderer'
import { MenuDropdown, type MenuItem } from './MenuDropdown'

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')
  return {
    Ionicons: (props: { name: string }) => <Text testID={`icon-${props.name}`}>{props.name}</Text>,
  }
})

const ANCHOR = { height: 36, width: 44, x: 300, y: 500 }

const defaultProps = {
  anchor: ANCHOR,
  items: [{ onPress: jest.fn(), text: 'Пункт' }] as MenuItem[],
  onClose: jest.fn(),
  visible: true,
}

const renderMenu = async (props?: Partial<typeof defaultProps>) =>
  renderWithProviders(<MenuDropdown {...defaultProps} {...props} />)

const measureMenu = async (container: TestInstance) => {
  const layoutView = container.queryAll(node => node.props.onLayout !== undefined, {
    includeSelf: true,
  })[0]
  await act(async () => {
    fireEvent(layoutView, 'layout', {
      nativeEvent: { layout: { height: 100, width: 160, x: 0, y: 0 } },
    })
  })
}

describe('<MenuDropdown>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders item text', async () => {
    await renderMenu()

    expect(screen.getByText('Пункт')).toBeTruthy()
  })

  test('renders multiple items', async () => {
    await renderMenu({
      items: [
        { onPress: jest.fn(), text: 'Первый' },
        { onPress: jest.fn(), text: 'Второй' },
      ],
    })

    expect(screen.getByText('Первый')).toBeTruthy()
    expect(screen.getByText('Второй')).toBeTruthy()
  })

  test('renders icon when provided', async () => {
    await renderMenu({ items: [{ icon: 'trash-outline', onPress: jest.fn(), text: 'Пункт' }] })

    expect(screen.getByTestId('icon-trash-outline')).toBeTruthy()
  })

  test('item press fires onPress and closes the menu', async () => {
    const onPress = jest.fn()
    const onClose = jest.fn()
    const { container } = await renderMenu({ items: [{ onPress, text: 'Пункт' }], onClose })

    await measureMenu(container)

    fireEvent.press(screen.getByText('Пункт'))

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('disabled item does not fire onPress', async () => {
    const onPress = jest.fn()
    const { container } = await renderMenu({ items: [{ disabled: true, onPress, text: 'Пункт' }] })

    await measureMenu(container)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    fireEvent.press(screen.getByText('Пункт'))

    expect(onPress).not.toHaveBeenCalled()
  })
})
