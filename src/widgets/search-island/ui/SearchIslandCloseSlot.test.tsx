import { act, type RenderResult } from '@testing-library/react-native'
import { makeMutable } from 'react-native-reanimated'
import { type TestInstance } from 'test-renderer'
import { renderWithProviders } from 'shared/mocks'
import { SearchIslandCloseSlot } from './SearchIslandCloseSlot'

const CLOSE_LABEL = 'Закрыть поиск'
const SCREEN_WIDTH = 400
const TAB_BAR_HEIGHT = 98
// Press resolution lands within single-digit ms; these bound the grace window
// from inside and from beyond without coupling to its exact constant.
const WITHIN_GRACE_MS = 100
const AFTER_GRACE_MS = 200

const createProps = (isVisible: boolean) => ({
  closeProgress: makeMutable(1),
  isVisible,
  onPress: jest.fn(),
  openProgress: makeMutable(1),
  progress: makeMutable(1),
  restingStyle: {},
  screenWidth: SCREEN_WIDTH,
  tabBarHeight: TAB_BAR_HEIGHT,
})

const renderSlot = async (
  isVisible: boolean,
): Promise<{ props: ReturnType<typeof createProps> } & RenderResult> => {
  const props = createProps(isVisible)
  const result = await renderWithProviders(<SearchIslandCloseSlot {...props} />)

  return { ...result, props }
}

// GlassIsland forwards the gate to its host; walking up from the ✕ lands on the
// first node carrying it (the island itself or its rendered host view).
const findSlotGate = (node: null | TestInstance): TestInstance => {
  if (!node) throw new Error('Close slot gate not found')
  if ('pointerEvents' in node.props) return node

  return findSlotGate(node.parent)
}

const findCloseButton = (getByLabelText: RenderResult['getByLabelText']) =>
  getByLabelText(CLOSE_LABEL, { includeHiddenElements: true })

describe('<SearchIslandCloseSlot>', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  test('keeps the slot pointer-capable through the press-resolution window', async () => {
    const { getByLabelText, props, rerender } = await renderSlot(true)
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    expect(findSlotGate(findCloseButton(getByLabelText)).props.pointerEvents).toBe('auto')

    await rerender(<SearchIslandCloseSlot {...props} isVisible={false} />)
    await act(async () => {
      jest.advanceTimersByTime(WITHIN_GRACE_MS)
    })

    // The browser resolves the click that closed search after the press: the
    // slot must still answer the hit-test until then.
    expect(findSlotGate(findCloseButton(getByLabelText)).props.pointerEvents).toBe('auto')

    await act(async () => {
      jest.advanceTimersByTime(AFTER_GRACE_MS)
    })

    expect(findSlotGate(findCloseButton(getByLabelText)).props.pointerEvents).toBe('none')
  })

  test('re-shows the slot immediately and cancels the pending inert flip', async () => {
    const { getByLabelText, props, rerender } = await renderSlot(true)
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await rerender(<SearchIslandCloseSlot {...props} isVisible={false} />)
    await act(async () => {
      jest.advanceTimersByTime(WITHIN_GRACE_MS)
    })
    await rerender(<SearchIslandCloseSlot {...props} isVisible />)

    expect(findSlotGate(findCloseButton(getByLabelText)).props.pointerEvents).toBe('auto')

    await act(async () => {
      jest.advanceTimersByTime(AFTER_GRACE_MS)
    })

    expect(findSlotGate(findCloseButton(getByLabelText)).props.pointerEvents).toBe('auto')
  })

  test('clears the pending grace on unmount', async () => {
    const { props, rerender, unmount } = await renderSlot(true)
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    // Spies must wrap the fake timers, not the real ones they replace.
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    const scheduleSpy = jest.spyOn(global, 'setTimeout')

    await rerender(<SearchIslandCloseSlot {...props} isVisible={false} />)
    const graceTimerId = scheduleSpy.mock.results.at(-1)?.value

    await unmount()

    // Without the cleanup the timer fires after unmount and updates state.
    expect(clearTimeoutSpy).toHaveBeenCalledWith(graceTimerId)

    await act(async () => {
      jest.advanceTimersByTime(AFTER_GRACE_MS)
    })
  })
})
