import { act, fireEvent, screen } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { createKeyDownEvent, installFakeDom } from 'shared/lib/testing'
import { renderWithProviders } from 'shared/mocks'
import type { TestInstance } from 'test-renderer'
import { MenuDropdown, type MenuItem } from './MenuDropdown'

const mockIoniconsSpy = jest.fn()

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')
  return {
    Ionicons: (props: { name: string }) => {
      mockIoniconsSpy(props)
      return <Text>{props.name}</Text>
    },
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

    expect(mockIoniconsSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'trash-outline' }))
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

describe('<MenuDropdown> web Escape handling', () => {
  test('Escape on web closes the menu via onClose', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const onClose = jest.fn()
      await renderMenu({ onClose })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onClose).toHaveBeenCalledTimes(1)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape does not close the menu when visible is false', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const onClose = jest.fn()
      await renderMenu({ onClose, visible: false })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onClose).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape with a modifier held does not close the menu', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const onClose = jest.fn()
      await renderMenu({ onClose })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape', { ctrlKey: true }))
      })

      expect(onClose).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape on native does not close the menu', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    try {
      const onClose = jest.fn()
      await renderMenu({ onClose })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onClose).not.toHaveBeenCalled()
    } finally {
      restore()
    }
  })
})
