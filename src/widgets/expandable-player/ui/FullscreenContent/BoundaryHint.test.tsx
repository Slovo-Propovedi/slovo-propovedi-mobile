import '@testing-library/jest-native/extend-expect'
import { act } from '@testing-library/react-native'
import { trackBoundaryNoticeAtom } from 'entities/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import type { createStyles } from '../ExpandablePlayer/styles'
import { BoundaryHint, HINT_DURATION_MS } from './BoundaryHint'

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    trackBoundaryNoticeAtom: atom(null, 'mockTrackBoundaryNoticeAtom'),
  }
})

const FIRST_TEXT = 'Это первая проповедь'
const LAST_TEXT = 'Это последняя проповедь'

const styles = {
  boundaryHint: {},
  boundaryHintAnchor: {},
  boundaryHintText: {},
} as unknown as ReturnType<typeof createStyles>

const renderHint = () => renderWithProviders(<BoundaryHint styles={styles} />, { ctx })

describe('<BoundaryHint>', () => {
  beforeEach(() => {
    trackBoundaryNoticeAtom(ctx, null)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('renders nothing without a notice', async () => {
    const { queryByText } = await renderHint()

    expect(queryByText(FIRST_TEXT)).toBeNull()
    expect(queryByText(LAST_TEXT)).toBeNull()
  })

  test('shows first-boundary text when a notice arrives', async () => {
    const { getByText } = await renderHint()

    await act(async () => {
      trackBoundaryNoticeAtom(ctx, { at: Date.now(), boundary: 'first' })
    })

    expect(getByText(FIRST_TEXT)).toBeTruthy()
  })

  test('shows last-boundary text when a notice arrives', async () => {
    const { getByText } = await renderHint()

    await act(async () => {
      trackBoundaryNoticeAtom(ctx, { at: Date.now(), boundary: 'last' })
    })

    expect(getByText(LAST_TEXT)).toBeTruthy()
  })

  test('hides after the hint duration', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const { queryByText } = await renderHint()

    await act(async () => {
      trackBoundaryNoticeAtom(ctx, { at: Date.now(), boundary: 'first' })
    })
    expect(queryByText(FIRST_TEXT)).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(HINT_DURATION_MS)
    })

    expect(queryByText(FIRST_TEXT)).toBeNull()
  })

  test('re-shows when the same boundary is tapped again', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const { queryByText } = await renderHint()

    await act(async () => {
      trackBoundaryNoticeAtom(ctx, { at: Date.now(), boundary: 'first' })
    })
    expect(queryByText(FIRST_TEXT)).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(HINT_DURATION_MS)
    })
    expect(queryByText(FIRST_TEXT)).toBeNull()

    await act(async () => {
      trackBoundaryNoticeAtom(ctx, { at: Date.now(), boundary: 'first' })
    })
    expect(queryByText(FIRST_TEXT)).toBeTruthy()
  })

  test('does not re-show a stale notice after remount', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const first = await renderHint()

    await act(async () => {
      trackBoundaryNoticeAtom(ctx, { at: Date.now(), boundary: 'first' })
    })
    expect(first.queryByText(FIRST_TEXT)).toBeTruthy()

    // Let the toast hide and the notice age past STALE_NOTICE_MAX_AGE_MS.
    await act(async () => {
      jest.advanceTimersByTime(HINT_DURATION_MS + 5000)
    })
    expect(first.queryByText(FIRST_TEXT)).toBeNull()

    await act(async () => {
      first.unmount()
    })

    const second = await renderHint()
    expect(second.queryByText(FIRST_TEXT)).toBeNull()
  })
})
