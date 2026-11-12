import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { type ReactElement } from 'react'
import { StyleSheet } from 'react-native'
import {
  isSearchFieldFocusedAtom,
  searchFocusRequestAtom,
  searchQueryAtom,
} from 'features/sermon-search'
import { useFeatureFlag } from 'entities/feature-flags'
import { searchHistoryAtom } from 'entities/search-history'
import { type AudioPlayerData, type SermonData } from 'entities/sermon'
import { renderWithProviders } from 'shared/mocks'
import { showInfo } from 'shared/model/info-dialog'
import { INDENTS } from 'shared/ui/theme'
import { type PagedSearch } from '../lib/pagedGroup'
import { usePagedSearch } from '../lib/usePagedSearch'
import { PillTabs } from './PillTabs'
import { SearchScreen } from './SearchScreen'

const mockUsePagedSearch = usePagedSearch as jest.MockedFunction<typeof usePagedSearch>
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>
const mockShowInfo = showInfo as jest.MockedFunction<typeof showInfo>

jest.mock('../lib/usePagedSearch', () => ({
  usePagedSearch: jest.fn(),
}))

// Spy on the real component: the screen's contract with the select is the props
// it passes (which variant), while rendering behavior stays the real one.
jest.mock('./PillTabs', () => {
  const actual = jest.requireActual('./PillTabs')

  return { ...actual, PillTabs: jest.fn(actual.PillTabs) }
})

jest.mock('entities/feature-flags', () => ({
  useFeatureFlag: jest.fn(() => false),
}))

jest.mock('shared/model/info-dialog', () => ({
  showInfo: jest.fn(),
}))

jest.mock('features/onboarding', () => ({
  OnboardingTarget: ({ children }: { children: ReactElement }) => children,
}))

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

  const TracksListItem = (props: { onPress: () => void; title: string }) => (
    <Text onPress={props.onPress}>{props.title}</Text>
  )
  TracksListItem.Skeleton = () => <View testID='tracks-list-item-skeleton' />

  return {
    TRACK_LIST_ITEM_SIZES: jest.requireActual('entities/track-list').TRACK_LIST_ITEM_SIZES,
    TracksListItem,
  }
})

jest.mock('entities/listening-history', () => ({
  buildHistoryMenuActions: jest.fn(() => []),
  useHistoryProgressMap: jest.fn(() => new Map()),
  useHistorySermonIds: jest.fn(() => new Set()),
}))

const RECENT_SEARCHES_TITLE = 'Недавние поиски'

const SERMON: SermonData = {
  artist: 'Иван',
  artwork: null,
  audioUrl: 'https://example.com/sermon.mp3',
  id: 'sermon-1',
  title: 'Проповедь о вере',
}

const PLAYLIST = {
  artwork: null,
  description: 'Описание',
  id: 'playlist-1',
  sermons: [],
  title: 'Плейлист веры',
}

const PREACHER = 'Иван'

const createGroup = <T,>(items: T[]) => ({
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  items,
  loadMore: jest.fn(),
})

const createPaged = (overrides: Partial<PagedSearch> = {}): PagedSearch => ({
  playlists: createGroup([]),
  preachers: createGroup([]),
  sermons: createGroup([]),
  ...overrides,
})

// Props the screen handed to the real <PillTabs>: `variant` is the styling
// contract, so find the call whose items contain the given key.
const getTabsProps = (itemKey: string) =>
  jest
    .mocked(PillTabs)
    .mock.calls.map(([props]) => props)
    .find(props => props.items.some(item => item.key === itemKey))

const renderScreen = async ({
  focused = false,
  history,
  paged = createPaged(),
  query = '',
  readEnabled = false,
}: {
  focused?: boolean
  history?: SermonData[]
  paged?: PagedSearch
  query?: string
  readEnabled?: boolean
} = {}) => {
  const ctx = createCtx()
  searchQueryAtom(ctx, query)
  isSearchFieldFocusedAtom(ctx, focused)
  if (history) searchHistoryAtom(ctx, history.map(historyEntry))
  mockUsePagedSearch.mockReturnValue(paged)
  mockUseFeatureFlag.mockReturnValue(readEnabled)

  const onSermonPress = jest.fn()
  const onPlaylistPress = jest.fn()
  const onAddToPlaylist = jest.fn()

  const result = await renderWithProviders(
    <SearchScreen
      onSermonPress={onSermonPress}
      onAddToPlaylist={onAddToPlaylist}
      onPlaylistPress={onPlaylistPress}
    />,
    { ctx },
  )

  return { ...result, ctx, onAddToPlaylist, onPlaylistPress, onSermonPress }
}

const historyEntry = (sermon: SermonData): { savedAt: number; sermon: AudioPlayerData } => ({
  savedAt: 1,
  sermon: { ...sermon, audioUrl: sermon.audioUrl ?? '' },
})

describe('<SearchScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFeatureFlag.mockReturnValue(false)
  })

  test('shows the large «Поиск» title when the field is blurred and the query is empty', async () => {
    await renderScreen()

    expect(screen.getByRole('header', { name: 'Поиск' })).toBeTruthy()
    expect(screen.queryByText('Слушать')).toBeNull()
    expect(screen.queryByText(RECENT_SEARCHES_TITLE)).toBeNull()
  })

  test('shows scope pills and recent searches while the field is focused with an empty query', async () => {
    const ctx = createCtx()
    searchQueryAtom(ctx, '')
    isSearchFieldFocusedAtom(ctx, true)
    searchHistoryAtom(ctx, [historyEntry(SERMON)])
    mockUsePagedSearch.mockReturnValue(createPaged())

    await renderWithProviders(
      <SearchScreen onSermonPress={jest.fn()} onPlaylistPress={jest.fn()} />,
      { ctx },
    )

    expect(screen.queryByRole('header', { name: 'Поиск' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Слушать' })).toBeSelected()
    expect(screen.getByRole('button', { name: 'Читать' })).toBeTruthy()
    expect(screen.getByText(RECENT_SEARCHES_TITLE)).toBeTruthy()
    expect(screen.getByText(SERMON.title)).toBeTruthy()
  })

  test('keeps the scope tabs a small gap below the top safe area', async () => {
    await renderScreen({ focused: true })

    const container = screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.flex === 1 && flat?.paddingTop === INDENTS.low
    })[0]

    expect(container).toBeDefined()
  })

  test('shows group pills and the selected group results for an active query', async () => {
    const { onSermonPress } = await renderScreen({
      focused: true,
      paged: createPaged({ sermons: createGroup([SERMON]) }),
      query: 'вера',
    })

    expect(screen.getByRole('button', { name: 'Проповеди' })).toBeSelected()
    expect(screen.getByRole('button', { name: 'Плейлисты' })).not.toBeSelected()
    expect(screen.getByText(SERMON.title)).toBeTruthy()

    await fireEvent.press(screen.getByText(SERMON.title))

    expect(onSermonPress).toHaveBeenCalledWith(expect.objectContaining({ id: SERMON.id }))
  })

  test('keeps the results visible when the field blurs with an active query', async () => {
    await renderScreen({ paged: createPaged({ sermons: createGroup([SERMON]) }), query: 'вера' })

    expect(screen.queryByRole('header', { name: 'Поиск' })).toBeNull()
    expect(screen.getByText(SERMON.title)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Проповеди' })).toBeSelected()
  })

  test('switches the results group and forwards playlist presses', async () => {
    const { onPlaylistPress } = await renderScreen({
      focused: true,
      paged: createPaged({ playlists: createGroup([PLAYLIST]) }),
      query: 'вера',
    })

    await fireEvent.press(screen.getByRole('button', { name: 'Плейлисты' }))
    await fireEvent.press(screen.getByText(PLAYLIST.title))

    expect(onPlaylistPress).toHaveBeenCalledWith(expect.objectContaining({ id: PLAYLIST.id }))
  })

  test('preacher press re-runs the search for that artist', async () => {
    const { ctx } = await renderScreen({
      focused: true,
      paged: createPaged({ preachers: createGroup([PREACHER]) }),
      query: 'вера',
    })

    await fireEvent.press(screen.getByRole('button', { name: 'Проповедники' }))
    await fireEvent.press(screen.getByText(PREACHER))

    expect(ctx.get(searchQueryAtom)).toBe(PREACHER)
  })

  test('hides the scope tabs and recents from three characters', async () => {
    await renderScreen({ focused: true, history: [SERMON], query: 'вер' })

    expect(screen.queryByRole('button', { name: 'Слушать' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Читать' })).toBeNull()
    expect(screen.queryByText(RECENT_SEARCHES_TITLE)).toBeNull()
    expect(screen.getByRole('button', { name: 'Проповеди' })).toBeTruthy()
  })

  test('brings the scope tabs back when the query is cleared', async () => {
    const { ctx } = await renderScreen({ focused: true, query: 'вер' })

    await act(async () => {
      searchQueryAtom(ctx, '')
    })

    expect(screen.getByRole('button', { name: 'Слушать' })).toBeTruthy()
  })

  test('renders the group select in the results style', async () => {
    await renderScreen({ focused: true, query: 'вера' })

    expect(getTabsProps('sermons')?.variant).toBe('results')
  })

  test('keeps the scope select in the default style', async () => {
    await renderScreen({ focused: true })

    expect(getTabsProps('listen')?.variant).toBeUndefined()
  })

  test('adds extra space below the results select', async () => {
    await renderScreen({ focused: true, query: 'вера' })

    expect(screen.getByTestId('search-group-tabs')).toHaveStyle({ marginBottom: INDENTS.medium })
  })

  test('explains that the read scope is unavailable when its flag is off', async () => {
    await renderScreen({ focused: true })

    await fireEvent.press(screen.getByRole('button', { name: 'Читать' }))

    expect(mockShowInfo).toHaveBeenCalled()
  })

  test('requests focus before and after the locked read-scope dialog', async () => {
    const { ctx } = await renderScreen({ focused: true })
    const initialNonce = ctx.get(searchFocusRequestAtom)?.nonce ?? 0

    await fireEvent.press(screen.getByRole('button', { name: 'Читать' }))

    expect(ctx.get(searchFocusRequestAtom)?.nonce).toBe(initialNonce + 1)

    const onDismiss = mockShowInfo.mock.calls[0]?.[2]?.onDismiss
    expect(onDismiss).toBeDefined()
    onDismiss?.()

    expect(ctx.get(searchFocusRequestAtom)?.nonce).toBe(initialNonce + 2)
  })

  test('keeps the empty pose for a two-character query', async () => {
    await renderScreen({ focused: true, history: [SERMON], query: 'ве' })

    expect(screen.getByRole('button', { name: 'Слушать' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Читать' })).toBeTruthy()
    expect(screen.getByText(RECENT_SEARCHES_TITLE)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Проповеди' })).toBeNull()
  })

  test('keeps the search title pose for a two-character query while blurred', async () => {
    await renderScreen({ query: 'ве' })

    expect(screen.getByRole('header', { name: 'Поиск' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Проповеди' })).toBeNull()
  })

  test('shows the empty state from three characters', async () => {
    await renderScreen({ focused: true, query: 'вер' })

    expect(screen.getByText('Ничего не найдено')).toBeTruthy()
  })

  test('shows the read placeholder and stops fetching when the flag is on', async () => {
    const { ctx } = await renderScreen({ focused: true, readEnabled: true })

    await fireEvent.press(screen.getByRole('button', { name: 'Читать' }))
    await act(async () => {
      searchQueryAtom(ctx, 'вера')
    })

    expect(screen.getByText('Раздел «Читать» скоро появится')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Проповеди' })).toBeNull()
    expect(mockUsePagedSearch).toHaveBeenLastCalledWith('')
  })
})
