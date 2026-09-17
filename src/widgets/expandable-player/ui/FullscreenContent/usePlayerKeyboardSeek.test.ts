import { act } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { isPlayerExpandedAtom } from 'entities/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { createKeyEvent, type FakeDom, installFakeDom } from 'shared/lib/testing'
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

const mockTapSeek = jest.fn()
const mockStartSeek = jest.fn()
const mockStopSeek = jest.fn()
const mockTogglePlay = jest.fn()
const mockCollapsePlayer = jest.fn()

let fakeDom: FakeDom

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
    fakeDom = installFakeDom()
    isPlayerExpandedAtom(ctx, false)
    jest.clearAllMocks()
  })

  afterEach(() => {
    // NOTE: global.window is intentionally NOT deleted here — RNTL's auto-cleanup
    // unmounts the hook after this hook runs, and the unmount cleanup reads window.
    // installFakeDom's restore() leaves no-op stubs behind for exactly this reason.
    fakeDom.restore()
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  test('attaches no listeners when the player is collapsed', async () => {
    await renderKeyboardSeek()

    expect(fakeDom.window.addEventListener).not.toHaveBeenCalled()
  })

  test('attaches no listeners on non-web platforms', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios')
    isPlayerExpandedAtom(ctx, true)

    await renderKeyboardSeek()

    expect(fakeDom.window.addEventListener).not.toHaveBeenCalled()
  })

  test('attaches keydown, keyup and blur listeners when expanded on web', async () => {
    isPlayerExpandedAtom(ctx, true)

    await renderKeyboardSeek()

    expect(fakeDom.window.addEventListener).toHaveBeenCalledWith(
      KEYDOWN_EVENT,
      expect.any(Function),
    )
    expect(fakeDom.window.addEventListener).toHaveBeenCalledWith(KEYUP_EVENT, expect.any(Function))
    expect(fakeDom.window.addEventListener).toHaveBeenCalledWith(BLUR_EVENT, expect.any(Function))
  })

  test('tapping ArrowRight seeks forward and prevents the default action', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent()
    fakeDom.fireKeyDown(event)

    expect(mockTapSeek).toHaveBeenCalledWith('forward')
    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockStartSeek).not.toHaveBeenCalled()
  })

  test('holding ArrowRight past the hold delay starts the accelerating seek', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    fakeDom.fireKeyDown(createKeyEvent())
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    expect(mockStartSeek).toHaveBeenCalledWith('forward')

    fakeDom.fireKeyUp(createKeyEvent())
    expect(mockStopSeek).toHaveBeenCalled()
  })

  test('ignores OS auto-repeat keydown events', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ repeat: true })
    fakeDom.fireKeyDown(event)

    expect(mockTapSeek).not.toHaveBeenCalled()
    expect(mockStartSeek).not.toHaveBeenCalled()
    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('ignores keydown on editable targets', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ target: { tagName: 'INPUT' } })
    fakeDom.fireKeyDown(event)

    expect(mockTapSeek).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('ignores arrow keys when a modifier is held', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ ctrlKey: true })
    fakeDom.fireKeyDown(event)

    expect(mockTapSeek).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('stops the seek when the window loses focus mid-hold', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    fakeDom.fireKeyDown(createKeyEvent())
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    expect(mockStartSeek).toHaveBeenCalledWith('forward')

    fakeDom.fireBlur()
    expect(mockStopSeek).toHaveBeenCalled()
  })

  test('switching direction while holding restarts the gesture', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    fakeDom.fireKeyDown(createKeyEvent({ key: ARROW_RIGHT_KEY }))
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    expect(mockStartSeek).toHaveBeenCalledWith('forward')

    fakeDom.fireKeyDown(createKeyEvent({ key: ARROW_LEFT_KEY }))
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
    fakeDom.fireKeyDown(event)

    expect(mockTogglePlay).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('Space is ignored on interactive targets so native button activation is not double-fired', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: SPACE_KEY, target: { tagName: 'BUTTON' } })
    fakeDom.fireKeyDown(event)

    expect(mockTogglePlay).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('Space is ignored on elements with an interactive role', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: SPACE_KEY, target: { getAttribute: () => 'button' } })
    fakeDom.fireKeyDown(event)

    expect(mockTogglePlay).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('Space is ignored when a modifier is held', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: SPACE_KEY, shiftKey: true })
    fakeDom.fireKeyDown(event)

    expect(mockTogglePlay).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('Space auto-repeat is ignored', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: SPACE_KEY, repeat: true })
    fakeDom.fireKeyDown(event)

    expect(mockTogglePlay).not.toHaveBeenCalled()
    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('Escape collapses the player and prevents the default action', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: ESCAPE_KEY })
    fakeDom.fireDocumentKeyDown(event)

    expect(mockCollapsePlayer).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('Escape is ignored on editable targets', async () => {
    isPlayerExpandedAtom(ctx, true)
    await renderKeyboardSeek()

    const event = createKeyEvent({ key: ESCAPE_KEY, target: { tagName: 'TEXTAREA' } })
    fakeDom.fireDocumentKeyDown(event)

    expect(mockCollapsePlayer).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('detaches listeners on unmount', async () => {
    isPlayerExpandedAtom(ctx, true)
    const { unmount } = await renderKeyboardSeek()

    const keydownHandler = fakeDom.window.getListeners(KEYDOWN_EVENT)[0]
    const keyupHandler = fakeDom.window.getListeners(KEYUP_EVENT)[0]
    const blurHandler = fakeDom.window.getListeners(BLUR_EVENT)[0]

    await act(async () => {
      unmount()
    })

    expect(fakeDom.window.removeEventListener).toHaveBeenCalledWith(KEYDOWN_EVENT, keydownHandler)
    expect(fakeDom.window.removeEventListener).toHaveBeenCalledWith(KEYUP_EVENT, keyupHandler)
    expect(fakeDom.window.removeEventListener).toHaveBeenCalledWith(BLUR_EVENT, blurHandler)
  })
})
