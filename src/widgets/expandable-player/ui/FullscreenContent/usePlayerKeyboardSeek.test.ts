import { act } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { isPlayerExpandedAtom } from 'entities/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { usePlayerKeyboardSeek } from './usePlayerKeyboardSeek'

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    isPlayerExpandedAtom: atom(false, 'mockIsPlayerExpandedAtom'),
  }
})

const KEYDOWN_EVENT = 'keydown'
const KEYUP_EVENT = 'keyup'
const BLUR_EVENT = 'blur'
const ARROW_LEFT_KEY = 'ArrowLeft'
const ARROW_RIGHT_KEY = 'ArrowRight'
const ESCAPE_KEY = 'Escape'
const SPACE_KEY = ' '

interface KeyEventLike {
  altKey: boolean
  ctrlKey: boolean
  key: string
  metaKey: boolean
  preventDefault: () => void
  repeat: boolean
  shiftKey: boolean
  stopPropagation: () => void
  target: unknown
}

type WindowListener = (event?: unknown) => void

const mockTapSeek = jest.fn()
const mockStartSeek = jest.fn()
const mockStopSeek = jest.fn()
const mockTogglePlay = jest.fn()
const mockCollapsePlayer = jest.fn()

let mockWindowListeners: Record<string, WindowListener>
let mockDocumentListeners: Record<string, WindowListener>

const mockWindow = {
  addEventListener: jest.fn((type: string, handler: WindowListener) => {
    mockWindowListeners[type] = handler
  }),
  removeEventListener: jest.fn((type: string) => {
    delete mockWindowListeners[type]
  }),
}

const mockDocument = {
  addEventListener: jest.fn((type: string, handler: WindowListener) => {
    mockDocumentListeners[type] = handler
  }),
  documentElement: { style: { setProperty: jest.fn() } },
  removeEventListener: jest.fn((type: string) => {
    delete mockDocumentListeners[type]
  }),
}

const createKeyEvent = (overrides: Partial<KeyEventLike> = {}): KeyEventLike => ({
  altKey: false,
  ctrlKey: false,
  key: ARROW_RIGHT_KEY,
  metaKey: false,
  preventDefault: jest.fn(),
  repeat: false,
  shiftKey: false,
  stopPropagation: jest.fn(),
  target: null,
  ...overrides,
})

const fireKeyDown = (event: KeyEventLike) => {
  mockWindowListeners[KEYDOWN_EVENT]?.(event)
}

const fireDocumentKeyDown = (event: KeyEventLike) => {
  mockDocumentListeners[KEYDOWN_EVENT]?.(event)
}

const fireKeyUp = (event: KeyEventLike) => {
  mockWindowListeners[KEYUP_EVENT]?.(event)
}

const fireBlur = () => {
  mockWindowListeners[BLUR_EVENT]?.()
}

const renderKeyboardSeek = () =>
  renderHookWithProviders(
    () =>
      usePlayerKeyboardSeek({
        collapsePlayer: mockCollapsePlayer,
        startSeek: mockStartSeek,
        stopSeek: mockStopSeek,
        tapSeek: mockTapSeek,
        togglePlay: mockTogglePlay,
      }),
    { ctx },
  )

describe('usePlayerKeyboardSeek', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    jest.replaceProperty(Platform, 'OS', 'web')
    mockWindowListeners = {}
    mockDocumentListeners = {}
    ;(global as { window?: unknown }).window = mockWindow
    ;(global as { document?: unknown }).document = mockDocument
    isPlayerExpandedAtom(ctx, false)
    jest.clearAllMocks()
  })

  afterEach(() => {
    // NOTE: global.window is intentionally NOT deleted here — RNTL's auto-cleanup
    // unmounts the hook after this hook runs, and the unmount cleanup reads window.
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  test('attaches no listeners when the player is collapsed', async () => {
    await renderKeyboardSeek()

    expect(mockWindow.addEventListener).not.toHaveBeenCalled()
  })

  test('attaches no listeners on non-web platforms', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios')
    isPlayerExpandedAtom(ctx, true)

    await renderKeyboardSeek()

    expect(mockWindow.addEventListener).not.toHaveBeenCalled()
  })

  test('attaches keydown, keyup and blur listeners when expanded on web', async () => {
    isPlayerExpandedAtom(ctx, true)

    await renderKeyboardSeek()

    expect(mockWindow.addEventListener).toHaveBeenCalledWith(KEYDOWN_EVENT, expect.any(Function))
    expect(mockWindow.addEventListener).toHaveBeenCalledWith(KEYUP_EVENT, expect.any(Function))
    expect(mockWindow.addEventListener).toHaveBeenCalledWith(BLUR_EVENT, expect.any(Function))
  })

  test('tapping ArrowRight seeks forward and prevents the default action', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent()
    fireKeyDown(event)

    expect(mockTapSeek).toHaveBeenCalledWith('forward')
    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockStartSeek).not.toHaveBeenCalled()
  })

  test('holding ArrowRight past the hold delay starts the accelerating seek', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    fireKeyDown(createKeyEvent())
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    expect(mockStartSeek).toHaveBeenCalledWith('forward')

    fireKeyUp(createKeyEvent())
    expect(mockStopSeek).toHaveBeenCalled()
  })

  test('ignores OS auto-repeat keydown events', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ repeat: true })
    fireKeyDown(event)

    expect(mockTapSeek).not.toHaveBeenCalled()
    expect(mockStartSeek).not.toHaveBeenCalled()
    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('ignores keydown on editable targets', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ target: { tagName: 'INPUT' } })
    fireKeyDown(event)

    expect(mockTapSeek).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('ignores arrow keys when a modifier is held', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ ctrlKey: true })
    fireKeyDown(event)

    expect(mockTapSeek).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('stops the seek when the window loses focus mid-hold', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    fireKeyDown(createKeyEvent())
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    expect(mockStartSeek).toHaveBeenCalledWith('forward')

    fireBlur()
    expect(mockStopSeek).toHaveBeenCalled()
  })

  test('switching direction while holding restarts the gesture', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    fireKeyDown(createKeyEvent({ key: ARROW_RIGHT_KEY }))
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    expect(mockStartSeek).toHaveBeenCalledWith('forward')

    fireKeyDown(createKeyEvent({ key: ARROW_LEFT_KEY }))
    expect(mockStopSeek).toHaveBeenCalled()
    expect(mockTapSeek).toHaveBeenLastCalledWith('backward')

    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    expect(mockStartSeek).toHaveBeenLastCalledWith('backward')
  })

  test('Space toggles play and prevents the default action', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: SPACE_KEY })
    fireKeyDown(event)

    expect(mockTogglePlay).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('Space is ignored on interactive targets so native button activation is not double-fired', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: SPACE_KEY, target: { tagName: 'BUTTON' } })
    fireKeyDown(event)

    expect(mockTogglePlay).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('Space is ignored on elements with an interactive role', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: SPACE_KEY, target: { getAttribute: () => 'button' } })
    fireKeyDown(event)

    expect(mockTogglePlay).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('Space is ignored when a modifier is held', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: SPACE_KEY, shiftKey: true })
    fireKeyDown(event)

    expect(mockTogglePlay).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('Space auto-repeat is ignored', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: SPACE_KEY, repeat: true })
    fireKeyDown(event)

    expect(mockTogglePlay).not.toHaveBeenCalled()
    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('Escape collapses the player and prevents the default action', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: ESCAPE_KEY })
    fireDocumentKeyDown(event)

    expect(mockCollapsePlayer).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('Escape is ignored on editable targets', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: ESCAPE_KEY, target: { tagName: 'TEXTAREA' } })
    fireDocumentKeyDown(event)

    expect(mockCollapsePlayer).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('detaches listeners on unmount', async () => {
    isPlayerExpandedAtom(ctx, true)
    const { unmount } = await renderKeyboardSeek()

    const keydownHandler = mockWindowListeners[KEYDOWN_EVENT]
    const keyupHandler = mockWindowListeners[KEYUP_EVENT]
    const blurHandler = mockWindowListeners[BLUR_EVENT]

    await act(async () => {
      unmount()
    })

    expect(mockWindow.removeEventListener).toHaveBeenCalledWith(KEYDOWN_EVENT, keydownHandler)
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith(KEYUP_EVENT, keyupHandler)
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith(BLUR_EVENT, blurHandler)
  })
})
