import { createCtx } from '@reatom/framework'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { type ReactElement } from 'react'
import { searchHistoryAtom, type SearchHistoryEntry } from 'entities/search-history'
import { type AudioPlayerData } from 'entities/sermon'
import { renderWithProviders } from 'shared/mocks'
import { FONT_SIZES } from 'shared/ui/theme'
import { RecentSearchesSection } from './RecentSearchesSection'

const mockRequestSearchFocus = jest.fn()

// Spy through to the real action so refocusing stays observable while the
// search-focus nonce still advances.
jest.mock('features/sermon-search', () => {
  const actual = jest.requireActual('features/sermon-search')

  return {
    ...actual,
    requestSearchFocus: (...args: unknown[]) => {
      mockRequestSearchFocus(...args)
      return actual.requestSearchFocus(...args)
    },
  }
})

// The feature barrel re-exports the player-coupled search UI; these rows only
// need the track/search surface.
jest.mock('entities/player', () => ({
  usePlayNewSermon: jest.fn(),
}))

jest.mock('entities/offline-cache', () => ({
  useTrackItemCache: jest.fn(() => ({
    isCached: false,
    isCacheDisabled: false,
    isDownloading: false,
    isQueued: false,
    isSermonCachingEnabled: true,
    progressValue: -1,
    toggleCache: jest.fn(),
    visualState: 'cloud',
  })),
}))

jest.mock('entities/track-list', () => {
  const { Text, View } = jest.requireActual('react-native')

  const TracksListItem = (props: {
    menuActions?: Array<{ onPress: () => void; text: string }>
    renderMenuButton?: (button: ReactElement) => ReactElement
    title: string
  }) => (
    <View>
      <Text>{props.title}</Text>
      {props.menuActions?.map(action => (
        <Text key={action.text} onPress={action.onPress}>
          {action.text}
        </Text>
      ))}
    </View>
  )
  TracksListItem.Skeleton = () => <View testID='tracks-list-item-skeleton' />

  return {
    TRACK_LIST_ITEM_SIZES: jest.requireActual('entities/track-list').TRACK_LIST_ITEM_SIZES,
    TracksListItem,
  }
})

const buildSermon = (id: string, title: string): AudioPlayerData => ({
  artist: 'Проповедник',
  artwork: null,
  audioUrl: `https://example.com/${id}.mp3`,
  id,
  title,
})

const buildEntry = (id: string, title: string, savedAt: number): SearchHistoryEntry => ({
  savedAt,
  sermon: buildSermon(id, title),
})

const SECTION_TITLE = 'Недавние поиски'
const CLEAR_LABEL = 'Очистить'
const DIALOG_TITLE = 'Очистить историю поиска?'
const CANCEL_LABEL = 'Отмена'
const REMOVE_FROM_SEARCH_HISTORY = 'Удалить из истории поиска'

describe('<RecentSearchesSection>', () => {
  beforeEach(() => {
    mockRequestSearchFocus.mockClear()
  })

  test('renders stored sermons with the header and clear action', async () => {
    const ctx = createCtx()
    searchHistoryAtom(ctx, [buildEntry('1', 'Первая', 2), buildEntry('2', 'Вторая', 1)])

    await renderWithProviders(<RecentSearchesSection onPress={jest.fn()} />, { ctx })

    expect(screen.getByText(SECTION_TITLE)).toBeTruthy()
    expect(screen.getByText(CLEAR_LABEL)).toBeTruthy()
    expect(screen.getByText('Первая')).toBeTruthy()
    expect(screen.getByText('Вторая')).toBeTruthy()
  })

  test('renders the header on the next size token above the old one', async () => {
    await renderWithProviders(<RecentSearchesSection onPress={jest.fn()} />, {
      ctx: createCtxWithHistory([buildEntry('1', 'Первая', 1)]),
    })

    const title = screen.getByText(SECTION_TITLE)
    const clear = screen.getByText(CLEAR_LABEL)

    expect(title).toHaveStyle({ fontSize: FONT_SIZES.h3, fontWeight: '700' })
    // The clear action matches the title size but stays regular weight.
    expect(clear).toHaveStyle({ fontSize: FONT_SIZES.h3, fontWeight: '400' })
    expect(FONT_SIZES.h3).toBeGreaterThan(FONT_SIZES.lg)
    expect(FONT_SIZES.h3).toBeLessThan(FONT_SIZES.h1)
  })

  test('renders nothing without history', async () => {
    await renderWithProviders(<RecentSearchesSection onPress={jest.fn()} />)

    expect(screen.queryByText(SECTION_TITLE)).toBeNull()
  })

  test('plays the pressed recent sermon', async () => {
    const onPress = jest.fn()
    const entry = buildEntry('1', 'Первая', 1)

    await renderWithProviders(<RecentSearchesSection onPress={onPress} />, {
      ctx: createCtxWithHistory([entry]),
    })

    await fireEvent.press(screen.getByText('Первая'))

    expect(onPress).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))
  })

  test('opens its own dialog and reports the open state', async () => {
    const onClearDialogOpenChange = jest.fn()

    await renderWithProviders(
      <RecentSearchesSection
        onPress={jest.fn()}
        onClearDialogOpenChange={onClearDialogOpenChange}
      />,
      { ctx: createCtxWithHistory([buildEntry('1', 'Первая', 1)]) },
    )

    await fireEvent.press(screen.getByText(CLEAR_LABEL))

    expect(screen.getByText(DIALOG_TITLE)).toBeTruthy()
    expect(onClearDialogOpenChange).toHaveBeenCalledTimes(1)
    expect(onClearDialogOpenChange).toHaveBeenCalledWith(true)
  })

  test('reports the close and refocuses the field on cancel', async () => {
    const onClearDialogOpenChange = jest.fn()

    await renderWithProviders(
      <RecentSearchesSection
        onPress={jest.fn()}
        onClearDialogOpenChange={onClearDialogOpenChange}
      />,
      { ctx: createCtxWithHistory([buildEntry('1', 'Первая', 1)]) },
    )

    await fireEvent.press(screen.getByText(CLEAR_LABEL))
    await fireEvent.press(screen.getByText(CANCEL_LABEL))

    expect(screen.queryByText(DIALOG_TITLE)).toBeNull()
    expect(onClearDialogOpenChange).toHaveBeenLastCalledWith(false)
    expect(mockRequestSearchFocus).toHaveBeenCalledTimes(1)
  })

  test('clears the history, reports the close and refocuses on confirm', async () => {
    const ctx = createCtxWithHistory([buildEntry('1', 'Первая', 1)])
    const onClearDialogOpenChange = jest.fn()

    await renderWithProviders(
      <RecentSearchesSection
        onPress={jest.fn()}
        onClearDialogOpenChange={onClearDialogOpenChange}
      />,
      { ctx },
    )

    await fireEvent.press(screen.getByText(CLEAR_LABEL))
    await fireEvent.press(screen.getAllByText(CLEAR_LABEL).at(-1) as never)

    await waitFor(() => expect(ctx.get(searchHistoryAtom)).toEqual([]))
    expect(onClearDialogOpenChange).toHaveBeenLastCalledWith(false)
    expect(mockRequestSearchFocus).toHaveBeenCalledTimes(1)
  })

  test('removes a single entry through the row menu', async () => {
    const ctx = createCtxWithHistory([buildEntry('1', 'Первая', 2), buildEntry('2', 'Вторая', 1)])

    await renderWithProviders(<RecentSearchesSection onPress={jest.fn()} />, { ctx })

    await fireEvent.press(screen.getAllByText(REMOVE_FROM_SEARCH_HISTORY)[0])

    await waitFor(() =>
      expect(ctx.get(searchHistoryAtom).map(entry => entry.sermon.id)).toEqual(['2']),
    )
  })
})

const createCtxWithHistory = (entries: SearchHistoryEntry[]) => {
  const ctx = createCtx()
  searchHistoryAtom(ctx, entries)
  return ctx
}
