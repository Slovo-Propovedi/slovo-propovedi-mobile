import { render } from '@testing-library/react-native'
import { useEntryPlayback } from 'features/entry-playback'
import { type ListeningHistoryEntry } from 'entities/listening-history'
import { HistoryRow } from './HistoryRow'

interface CapturedTrackItemProps {
  menuActions?: Array<{ onPress: () => void; text: string }>
  onPress: () => void
}

const mockPlayEntry = jest.fn()
const mockTrackItemProps: CapturedTrackItemProps[] = []

jest.mock('features/entry-playback', () => ({
  useEntryPlayback: jest.fn(() => jest.fn()),
}))

// The listening-history barrel reaches shared/api through resolveEntryPlaylist;
// stub the cross-import so the generated faker ESM never loads in Jest.
jest.mock('entities/section/@x/listening-history', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    dynamicSectionsAtom: atom([], 'testDynamicSectionsAtom'),
  }
})

jest.mock('shared/ui/track-list', () => {
  const { View } = jest.requireActual('react-native')
  return {
    TracksListItem: (props: CapturedTrackItemProps) => {
      mockTrackItemProps.push(props)
      return <View testID='tracks-list-item' />
    },
  }
})

const mockSermon = {
  artist: 'Test Artist',
  artwork: 'https://example.com/art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Проповедь о вере',
}

// No `sermon` snapshot on purpose: getEntrySermon then rebuilds the sermon from
// the playlist on every call, which is what used to churn the menuActions memo.
const entryWithoutSermonSnapshot: ListeningHistoryEntry = {
  durationMs: 120000,
  lastPlayedAt: Date.now() - 3600000,
  playlist: {
    artwork: null,
    id: 'playlist-1',
    sermons: [mockSermon],
    title: 'Test Playlist',
  },
  positionMs: 30000,
}

describe('<HistoryRow>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTrackItemProps.length = 0
    jest.mocked(useEntryPlayback).mockReturnValue(mockPlayEntry)
  })

  test('keeps onPress and menuActions identity across rerenders without a sermon snapshot', async () => {
    const { rerender } = await render(
      <HistoryRow isPlaying={false} isAudioPlaying={false} entry={entryWithoutSermonSnapshot} />,
    )

    // Toggle isPlaying to defeat memo(HistoryRow) and force a real re-render.
    await rerender(
      <HistoryRow isPlaying={true} isAudioPlaying={false} entry={entryWithoutSermonSnapshot} />,
    )

    expect(mockTrackItemProps).toHaveLength(2)
    const [firstRender, secondRender] = mockTrackItemProps
    expect(secondRender.onPress).toBe(firstRender.onPress)
    expect(secondRender.menuActions).toBe(firstRender.menuActions)
  })
})
