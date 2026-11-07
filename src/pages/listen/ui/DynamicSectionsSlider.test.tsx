import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import { type PlaylistData } from 'entities/playlist'
import {
  dynamicSectionsAtom,
  fetchAllSections,
  isLoadingSectionsAtom,
  type SectionData,
  sectionDataSourceAtom,
} from 'entities/section'
import { renderWithProviders } from 'shared/mocks'
import { DynamicSectionsSlider } from './DynamicSectionsSlider'

const mockFetchAllSections = fetchAllSections as unknown as jest.Mock

const mockNavigateToPlaylist = jest.fn()
const mockNavigateToPlaylistList = jest.fn()
const mockPlayNewSermon = jest.fn()

const MOCK_PLAYLIST_SINGLE: PlaylistData = {
  artwork: null,
  id: 'single-playlist',
  sermons: [
    {
      artist: 'Artist',
      artwork: null,
      id: 'sermon-1',
      title: 'Sermon 1',
    },
  ],
  title: 'Single playlist',
}

jest.mock('entities/section', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    ...jest.requireActual('entities/section'),
    dynamicSectionsAtom: atom([], 'testDynamicSectionsAtom'),
    fetchAllSections: jest.fn(),
    isLoadingSectionsAtom: atom(false, 'testIsLoadingSectionsAtom'),
    sectionDataSourceAtom: atom('network', 'testSectionDataSourceAtom'),
  }
})

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    isPlayerExpandedAtom: atom(false, 'testIsPlayerExpandedAtom'),
    usePlayNewSermon: jest.fn(() => mockPlayNewSermon),
  }
})

jest.mock('shared/lib/network', () => ({
  useOfflineRetry: jest.fn(),
}))

jest.mock('../lib/useListenNavigation', () => ({
  useListenNavigation: () => ({
    navigateToPlaylist: mockNavigateToPlaylist,
    navigateToPlaylistList: mockNavigateToPlaylistList,
  }),
}))

jest.mock('shared/ui', () => {
  const { Text: RNText } = jest.requireActual('react-native')

  return {
    EmptyState: () => <RNText>EMPTY_STATE</RNText>,
    getSliderCardLayout: () => ({ cardWidth: 100, stride: 112 }),
    SliderItemSize: { Large: 'large', Middle: 'middle', Small: 'small', XLarge: 'xLarge' },
  }
})

jest.mock('./renderSection', () => {
  const { Text: RNText } = jest.requireActual('react-native')

  return {
    renderSection: ({
      index,
      onItemPress,
    }: {
      index: number
      onItemPress: (p: unknown) => void
    }) => <RNText onPress={() => onItemPress(MOCK_PLAYLIST_SINGLE)}>Section {index}</RNText>,
  }
})

jest.mock('./skeleton', () => {
  const { Text: RNText } = jest.requireActual('react-native')

  return {
    SectionsSkeleton: () => <RNText>SKELETON</RNText>,
  }
})

const makeSection = (id: string): SectionData => ({
  id,
  itemsSize: 'small',
  playlists: [],
  title: `Section ${id}`,
  transform: 'short',
})

describe('<DynamicSectionsSlider>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders all sections full-width', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection('a'), makeSection('b')])
    isLoadingSectionsAtom(ctx, false)
    sectionDataSourceAtom(ctx, 'network')

    const { getByText } = await renderWithProviders(<DynamicSectionsSlider />, { ctx })

    expect(getByText('Section 0')).toBeTruthy()
    expect(getByText('Section 1')).toBeTruthy()
  })

  test('opens the playlist page on tap even for a single-sermon playlist', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection('a')])
    isLoadingSectionsAtom(ctx, false)
    sectionDataSourceAtom(ctx, 'network')

    const { getByText } = await renderWithProviders(<DynamicSectionsSlider />, { ctx })

    fireEvent.press(getByText('Section 0'))

    expect(mockNavigateToPlaylist).toHaveBeenCalledWith(MOCK_PLAYLIST_SINGLE)
    expect(mockPlayNewSermon).not.toHaveBeenCalled()
  })

  test('fetches sections on first mount when they were never loaded', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [])
    isLoadingSectionsAtom(ctx, true)
    sectionDataSourceAtom(ctx, 'unknown')

    await renderWithProviders(<DynamicSectionsSlider />, { ctx })

    expect(mockFetchAllSections).toHaveBeenCalledTimes(1)
  })

  test('revalidates on mount when only cached sections are shown', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection('a')])
    isLoadingSectionsAtom(ctx, false)
    sectionDataSourceAtom(ctx, 'cache')

    const { getByText } = await renderWithProviders(<DynamicSectionsSlider />, { ctx })

    expect(getByText('Section 0')).toBeTruthy()
    expect(mockFetchAllSections).toHaveBeenCalledTimes(1)
  })

  test('does not refetch on remount once sections are already loaded', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection('a')])
    isLoadingSectionsAtom(ctx, false)
    sectionDataSourceAtom(ctx, 'network')

    const { rerender } = await renderWithProviders(<DynamicSectionsSlider key='first' />, { ctx })
    await rerender(<DynamicSectionsSlider key='second' />)

    expect(mockFetchAllSections).not.toHaveBeenCalled()
  })
})
