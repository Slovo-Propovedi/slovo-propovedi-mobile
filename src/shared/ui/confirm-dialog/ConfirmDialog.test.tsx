import { act, fireEvent, screen } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { ConfirmDialog } from './ConfirmDialog'

const TITLE = 'Confirm Action'
const MESSAGE = 'Are you sure you want to proceed?'
const MESSAGES = ['First line', 'Second line', 'Third line']
const onCancelMock = jest.fn()
const onConfirmMock = jest.fn()

const defaultProps = {
  message: MESSAGE,
  onCancel: onCancelMock,
  onConfirm: onConfirmMock,
  title: TITLE,
  visible: true,
}

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

describe('<ConfirmDialog>', () => {
  beforeEach(() => {
    onCancelMock.mockClear()
    onConfirmMock.mockClear()
  })

  test('renders nothing when visible is false', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} visible={false} />)

    expect(screen.queryByText(TITLE)).toBeNull()
  })

  test('renders the title when visible is true', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText(TITLE)).toBeTruthy()
  })

  test('renders the message as text when message is a string', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText(MESSAGE)).toBeTruthy()
  })

  test('renders multiple message lines when message is a string array', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} message={MESSAGES} />)

    for (const line of MESSAGES) expect(screen.getByText(line)).toBeTruthy()
  })

  test('shows both cancel and confirm buttons by default', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Отмена')).toBeTruthy()
    expect(screen.getByText('ОК')).toBeTruthy()
  })

  test('hides the cancel button when hideCancel is true', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} hideCancel />)

    expect(screen.queryByText('Отмена')).toBeNull()
    expect(screen.getByText('ОК')).toBeTruthy()
  })

  test('calls onCancel when cancel button is pressed', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} />)

    fireEvent.press(screen.getByText('Отмена'))

    expect(onCancelMock).toHaveBeenCalledTimes(1)
  })

  test('calls onConfirm when confirm button is pressed', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} />)

    fireEvent.press(screen.getByText('ОК'))

    expect(onConfirmMock).toHaveBeenCalledTimes(1)
  })
})

describe('<ConfirmDialog> web Escape handling', () => {
  beforeEach(() => {
    onCancelMock.mockClear()
    onConfirmMock.mockClear()
  })

  test('Escape on web closes the dialog via onCancel', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderWithProviders(<ConfirmDialog {...defaultProps} />)

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onCancelMock).toHaveBeenCalledTimes(1)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape does not close the dialog when visible is false', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderWithProviders(<ConfirmDialog {...defaultProps} visible={false} />)

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onCancelMock).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape with a modifier held does not close the dialog', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderWithProviders(<ConfirmDialog {...defaultProps} />)

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape', { ctrlKey: true }))
      })

      expect(onCancelMock).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape on native does not close the dialog', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    try {
      await renderWithProviders(<ConfirmDialog {...defaultProps} />)

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onCancelMock).not.toHaveBeenCalled()
    } finally {
      restore()
    }
  })
})
