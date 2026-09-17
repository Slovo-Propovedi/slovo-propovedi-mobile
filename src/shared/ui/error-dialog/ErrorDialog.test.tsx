import { act, fireEvent, screen } from '@testing-library/react-native'
import { Text as MockText, Platform } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { ErrorDialog } from './ErrorDialog'

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props: { name: string }) => <MockText>{props.name}</MockText>,
}))

const COPY_LABEL = '📋 Копировать'
const COPIED_LABEL = '✓ Скопировано'

const MESSAGE = 'Something went wrong'
const DETAIL = 'Error at line 42'
const onDismissMock = jest.fn()

const defaultProps = {
  detail: DETAIL,
  message: MESSAGE,
  onDismiss: onDismissMock,
  visible: true,
}

const expectedCopyText = `ОШИБКА: ${MESSAGE}\n\nДЕТАЛИ:\n${DETAIL}`

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

describe('<ErrorDialog>', () => {
  beforeEach(() => {
    onDismissMock.mockClear()
  })

  test('does not render content when visible=false', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} visible={false} />)

    expect(screen.queryByText('Ошибка')).toBeNull()
  })

  test('renders the title when visible=true', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    expect(screen.getByText('Ошибка')).toBeTruthy()
  })

  test('renders the message text', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    expect(screen.getByText(MESSAGE)).toBeTruthy()
  })

  test('renders the detail text', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    expect(screen.getByText(DETAIL)).toBeTruthy()
  })

  test('copy button initially shows copy label', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    expect(screen.getByText(COPY_LABEL)).toBeTruthy()
  })

  test('pressing copy calls setStringAsync with formatted error text', async () => {
    const clipboard = jest.requireMock('expo-clipboard') as { setStringAsync: jest.Mock }
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    await act(async () => {
      fireEvent.press(screen.getByText(COPY_LABEL))
    })

    expect(clipboard.setStringAsync).toHaveBeenCalledTimes(1)
    expect(clipboard.setStringAsync).toHaveBeenCalledWith(expectedCopyText)
  })

  test('copy button changes to copied label after press', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    await act(async () => {
      fireEvent.press(screen.getByText(COPY_LABEL))
    })

    expect(screen.getByText(COPIED_LABEL)).toBeTruthy()
  })

  test('copy button reverts after 2s timeout', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    jest.useFakeTimers()

    await act(async () => {
      fireEvent.press(screen.getByText(COPY_LABEL))
    })

    expect(screen.getByText(COPIED_LABEL)).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(2000)
    })

    expect(screen.getByText(COPY_LABEL)).toBeTruthy()

    jest.useRealTimers()
  })

  test('close button calls onDismiss', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    fireEvent.press(screen.getByText('Закрыть'))

    expect(onDismissMock).toHaveBeenCalledTimes(1)
  })
})

describe('<ErrorDialog> web Escape handling', () => {
  beforeEach(() => {
    onDismissMock.mockClear()
  })

  test('Escape on web closes the dialog via onDismiss', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderWithProviders(<ErrorDialog {...defaultProps} />)

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onDismissMock).toHaveBeenCalledTimes(1)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape does not close the dialog when visible is false', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderWithProviders(<ErrorDialog {...defaultProps} visible={false} />)

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onDismissMock).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape with a modifier held does not close the dialog', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderWithProviders(<ErrorDialog {...defaultProps} />)

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape', { ctrlKey: true }))
      })

      expect(onDismissMock).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape on native does not close the dialog', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    try {
      await renderWithProviders(<ErrorDialog {...defaultProps} />)

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onDismissMock).not.toHaveBeenCalled()
    } finally {
      restore()
    }
  })
})
