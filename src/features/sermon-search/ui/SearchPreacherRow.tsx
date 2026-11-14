import { memo } from 'react'
import { TracksListItem, type TracksListItemProps } from 'entities/track-list'

// A preacher has no audio, so the track row gets a neutral, cache-off state:
// no status badge, no download progress and no cache action in the menu.
const NEUTRAL_CACHE_STATE: TracksListItemProps['cacheState'] = {
  isCached: false,
  isCacheDisabled: true,
  isDownloading: false,
  isQueued: false,
  isSermonCachingEnabled: false,
  progressValue: 0,
  toggleCache: () => Promise.resolve(),
  visualState: 'cloud',
}

// The ⋯ dropdown would open onto nothing for an artist (its only generic action
// is the cache toggle, disabled above), so keep the row’s trailing slot empty
// instead of rendering a dead interactive button.
const renderNoMenuButton = () => <></>

export const SearchPreacherRow = memo(
  ({ artist, onPress }: { artist: string; onPress: (artist: string) => void }) => (
    <TracksListItem
      title={artist}
      isPlaying={false}
      onPress={() => onPress(artist)}
      cacheState={NEUTRAL_CACHE_STATE}
      renderMenuButton={renderNoMenuButton}
    />
  ),
)
