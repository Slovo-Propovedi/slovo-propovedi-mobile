import '@testing-library/jest-native/extend-expect'
import { act } from '@testing-library/react-native'
import { trackToggleNoticeAtom } from 'entities/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import type { createStyles } from '../ExpandablePlayer/styles'
import { BoundaryHint, HINT_DURATION_MS } from './BoundaryHint'

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    trackToggleNoticeAtom: atom(null, 'mockTrackToggleNoticeAtom'),
  }
})

const FIRST_BOUNDARY_TEXT = 'Это первая проповедь'
const LAST_BOUNDARY_TEXT = 'Это последняя проповедь'
const RESTART_TEXT = 'Проповедь запущена заново'
const WRAP_FIRST_TEXT = 'Это начало плейлиста'
const WRAP_LAST_TEXT = 'Это конец плейлиста'

const styles = {
  boundaryHint: {},
  boundaryHintAnchor: {},
  boundaryHintText: {},
} as unknown as ReturnType<typeof createStyles>

const renderHint = () => renderWithProviders(<BoundaryHint styles={styles} />, { ctx })

describe('<BoundaryHint>', () => {
  beforeEach(() => {
    trackToggleNoticeAtom(ctx, null)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('renders nothing without a notice', async () => {
    const { queryByText } = await renderHint()

    expect(queryByText(FIRST_BOUNDARY_TEXT)).toBeNull()
    expect(queryByText(LAST_BOUNDARY_TEXT)).toBeNull()
  })

  test('shows first-boundary text when a notice arrives', async () => {
    const { getByText } = await renderHint()

    await act(async () => {
      trackToggleNoticeAtom(ctx, { at: Date.now(), boundary: 'first', kind: 'boundary' })
    })

    expect(getByText(FIRST_BOUNDARY_TEXT)).toBeTruthy()
  })

  test('shows last-boundary text when a notice arrives', async () => {
    const { getByText } = await renderHint()

    await act(async () => {
      trackToggleNoticeAtom(ctx, { at: Date.now(), boundary: 'last', kind: 'boundary' })
    })

    expect(getByText(LAST_BOUNDARY_TEXT)).toBeTruthy()
  })

  test('shows restart text when a restart notice arrives', async () => {
    const { getByText } = await renderHint()

    await act(async () => {
      trackToggleNoticeAtom(ctx, { at: Date.now(), kind: 'restart' })
    })

    expect(getByText(RESTART_TEXT)).toBeTruthy()
  })

  test('shows wrap-first text when a wrap notice arrives', async () => {
    const { getByText } = await renderHint()

    await act(async () => {
      trackToggleNoticeAtom(ctx, { at: Date.now(), kind: 'wrap', to: 'first' })
    })

    expect(getByText(WRAP_FIRST_TEXT)).toBeTruthy()
  })

  test('shows wrap-last text when a wrap notice arrives', async () => {
    const { getByText } = await renderHint()

    await act(async () => {
      trackToggleNoticeAtom(ctx, { at: Date.now(), kind: 'wrap', to: 'last' })
    })

    expect(getByText(WRAP_LAST_TEXT)).toBeTruthy()
  })

  test('hides after the hint duration', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const { queryByText } = await renderHint()

    await act(async () => {
      trackToggleNoticeAtom(ctx, { at: Date.now(), boundary: 'first', kind: 'boundary' })
    })
    expect(queryByText(FIRST_BOUNDARY_TEXT)).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(HINT_DURATION_MS)
    })

    expect(queryByText(FIRST_BOUNDARY_TEXT)).toBeNull()
  })

  test('re-shows when the same boundary is tapped again', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const { queryByText } = await renderHint()

    await act(async () => {
      trackToggleNoticeAtom(ctx, { at: Date.now(), boundary: 'first', kind: 'boundary' })
    })
    expect(queryByText(FIRST_BOUNDARY_TEXT)).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(HINT_DURATION_MS)
    })
    expect(queryByText(FIRST_BOUNDARY_TEXT)).toBeNull()

    await act(async () => {
      trackToggleNoticeAtom(ctx, { at: Date.now(), boundary: 'first', kind: 'boundary' })
    })
    expect(queryByText(FIRST_BOUNDARY_TEXT)).toBeTruthy()
  })

  test('does not re-show a stale notice after remount', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const first = await renderHint()

    await act(async () => {
      trackToggleNoticeAtom(ctx, { at: Date.now(), boundary: 'first', kind: 'boundary' })
    })
    expect(first.queryByText(FIRST_BOUNDARY_TEXT)).toBeTruthy()

    // Let the toast hide and the notice age past STALE_NOTICE_MAX_AGE_MS.
    await act(async () => {
      jest.advanceTimersByTime(HINT_DURATION_MS + 5000)
    })
    expect(first.queryByText(FIRST_BOUNDARY_TEXT)).toBeNull()

    await act(async () => {
      first.unmount()
    })

    const second = await renderHint()
    expect(second.queryByText(FIRST_BOUNDARY_TEXT)).toBeNull()
  })
})
