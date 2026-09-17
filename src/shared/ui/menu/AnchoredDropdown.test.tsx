import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Dimensions, Platform, StyleSheet, Text } from 'react-native'
import { AnchoredDropdown } from './AnchoredDropdown'

const BACKDROP_TEST_ID = 'anchored-dropdown-backdrop'
const MENU_TEST_ID = 'anchored-dropdown-menu'
const WINDOW_HEIGHT = 844
const WINDOW_WIDTH = 390

const baseAnchor = { height: 36, width: 44, x: 300, y: 500 }

const renderMenu = async (props?: Partial<React.ComponentProps<typeof AnchoredDropdown>>) => {
  await render(
    <AnchoredDropdown
      visible
      anchor={baseAnchor}
      onClose={jest.fn()}
      testID={MENU_TEST_ID}
      {...props}
    >
      <Text>Menu item</Text>
    </AnchoredDropdown>,
  )
}

const measureMenu = async (height = 100) => {
  await fireEvent(screen.getByTestId(MENU_TEST_ID), 'layout', {
    nativeEvent: { layout: { height, width: 160, x: 0, y: 0 } },
  })
}

const getMenuStyle = () => StyleSheet.flatten(screen.getByTestId(MENU_TEST_ID).props.style)

interface KeyDownEventLike {
  altKey: boolean
  ctrlKey: boolean
  key: string
  metaKey: boolean
  shiftKey: boolean
  stopPropagation: () => void
}

const createKeyDownEvent = (
  key: string,
  modifiers: Partial<Pick<KeyDownEventLike, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>> = {},
): KeyDownEventLike => ({
  altKey: modifiers.altKey ?? false,
  ctrlKey: modifiers.ctrlKey ?? false,
  key,
  metaKey: modifiers.metaKey ?? false,
  shiftKey: modifiers.shiftKey ?? false,
  stopPropagation: jest.fn(),
})

// jest-expo runs in a node environment: there is no real DOM. This installs a
// fake `document` that records keydown listeners and a `dispatchKeyDown` helper
// that simulates a window keydown reaching those document listeners.
const installFakeDom = () => {
  const listeners: Array<{ handler: (event: KeyDownEventLike) => void; type: string }> = []
  const fakeDocument = {
    addEventListener: (type: string, handler: (event: KeyDownEventLike) => void) => {
      listeners.push({ handler, type })
    },
    documentElement: { style: { setProperty: jest.fn() } },
    removeEventListener: (type: string, handler: (event: KeyDownEventLike) => void) => {
      const index = listeners.findIndex(l => l.handler === handler && l.type === type)
      if (index !== -1) listeners.splice(index, 1)
    },
  }
  const dispatchKeyDown = (event: KeyDownEventLike) => {
    listeners.forEach(({ handler }) => handler(event))
  }

  Object.defineProperty(global, 'document', {
    configurable: true,
    value: fakeDocument,
    writable: true,
  })

  return {
    dispatchKeyDown,
    restore: () => {
      // Leave a no-op stub behind: React unmounts the tree after the test
      // finishes, and the hook's effect cleanup calls document.removeEventListener.
      Object.defineProperty(global, 'document', {
        configurable: true,
        value: {
          addEventListener: jest.fn(),
          documentElement: { style: { setProperty: jest.fn() } },
          removeEventListener: jest.fn(),
        },
        writable: true,
      })
    },
  }
}

describe('<AnchoredDropdown>', () => {
  beforeEach(() => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({
      fontScale: 1,
      height: WINDOW_HEIGHT,
      scale: 1,
      width: WINDOW_WIDTH,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders nothing when visible is false', async () => {
    await renderMenu({ visible: false })

    expect(screen.queryByTestId(MENU_TEST_ID)).toBeNull()
  })

  test('renders nothing when anchor is null', async () => {
    await renderMenu({ anchor: null })

    expect(screen.queryByTestId(MENU_TEST_ID)).toBeNull()
  })

  test('hides menu until its height is measured', async () => {
    await renderMenu()

    expect(getMenuStyle()).toMatchObject({ opacity: 0, pointerEvents: 'none' })
  })

  test('places menu ABOVE the anchor by default', async () => {
    await renderMenu()

    await measureMenu(100)

    expect(getMenuStyle()).toMatchObject({ right: 46, top: 396 })
  })

  test('flips BELOW when the anchor is near the screen top', async () => {
    await renderMenu({ anchor: { height: 36, width: 44, x: 300, y: 50 } })

    await measureMenu(100)

    expect(getMenuStyle()).toMatchObject({ right: 46, top: 90 })
  })

  test('keeps menu ABOVE at the exact boundary', async () => {
    await renderMenu({ anchor: { height: 36, width: 44, x: 300, y: 104 } })

    await measureMenu(100)

    expect(getMenuStyle()).toMatchObject({ right: 46, top: 0 })
  })

  test('backdrop press calls onClose', async () => {
    const onClose = jest.fn()
    await renderMenu({ onClose })

    fireEvent.press(screen.getByTestId(BACKDROP_TEST_ID))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('backdrop is not keyboard-focusable', async () => {
    await renderMenu()

    expect(screen.getByTestId(BACKDROP_TEST_ID).props.tabIndex).toBe(-1)
  })
})

describe('<AnchoredDropdown> web Escape handling', () => {
  test('Escape on web closes the dropdown via onClose', async () => {
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

  test('Escape does not close the dropdown when visible is false', async () => {
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

  test('Escape with a modifier held does not close the dropdown', async () => {
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

  test('Escape on native does not close the dropdown', async () => {
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
