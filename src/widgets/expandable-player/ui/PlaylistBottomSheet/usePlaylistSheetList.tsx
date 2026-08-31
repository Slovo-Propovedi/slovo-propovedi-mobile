import { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { formatSermonReference } from 'shared/lib/format'
import type { PlaylistData } from 'shared/model'
import { type createStyles } from './PlaylistBottomSheet.styles'
import { PlaylistSheetRow } from './PlaylistSheetRow'
import { useScrollGuarantee } from './useScrollGuarantee'

export interface TrackListItemData {
  artwork?: null | string
  id: string
  subtitle?: string
  title: string
  url?: string
}

interface UsePlaylistSheetListParams {
  cacheTrigger: number
  currentAudioId?: string
  downloadingUrl?: null | string
  isAudioPlaying: boolean
  onPress: (index: number) => void
  onScroll: (y: number) => void
  playlist: PlaylistData
  progressMap: Map<string, number>
  settleTick: number
  sheetTop: number
  styles: ReturnType<typeof createStyles>
}

// Composes the list's data and handlers: playlist→track rows memo, the scroll
// guarantee footer, and the memoized row/separator renderers.
export const usePlaylistSheetList = ({
  cacheTrigger,
  currentAudioId,
  downloadingUrl,
  isAudioPlaying,
  onPress,
  onScroll,
  playlist,
  progressMap,
  settleTick,
  sheetTop,
  styles,
}: UsePlaylistSheetListParams) => {
  const tracksListData = useMemo<TrackListItemData[]>(
    () =>
      playlist.sermons.map(sermon => ({
        artwork: playlist.artwork,
        id: sermon.id,
        subtitle: formatSermonReference({
          book: sermon.book,
          chapter: sermon.chapter,
          verse: sermon.verse,
        }),
        title: sermon.title,
        url: sermon.audioUrl ?? undefined,
      })),
    [playlist],
  )
  const { footerHeight, handleContentSizeChange, handleWrapperLayout, maxListHeight, wrapperRef } =
    useScrollGuarantee({
      settleTick,
      sheetTop,
    })

  const handleScrollEvent = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      onScroll(event.nativeEvent.contentOffset.y)
    },
    [onScroll],
  )
  const renderItem = useCallback(
    ({ index, item }: { index: number; item: TrackListItemData }) => (
      <PlaylistSheetRow
        index={index}
        onPress={onPress}
        title={item.title}
        audioUrl={item.url}
        artwork={item.artwork}
        subtitle={item.subtitle}
        cacheTrigger={cacheTrigger}
        downloadingUrl={downloadingUrl}
        isPlaying={currentAudioId === item.id}
        storedProgress={progressMap.get(item.id)}
        isAudioPlaying={currentAudioId === item.id && isAudioPlaying}
      />
    ),
    [cacheTrigger, currentAudioId, downloadingUrl, isAudioPlaying, onPress, progressMap],
  )
  const ItemSeparator = useCallback(() => <View style={styles.divider} />, [styles])

  return {
    footerHeight,
    handleContentSizeChange,
    handleScrollEvent,
    handleWrapperLayout,
    ItemSeparator,
    maxListHeight,
    renderItem,
    tracksListData,
    wrapperRef,
  }
}
