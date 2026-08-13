import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { useAtom } from '@reatom/npm-react'
import { useCallback, useMemo } from 'react'
import { Text, View } from 'react-native'
import {
  currentAudioAtom,
  downloadingAudioUrlAtom,
  isPlayingAtom,
  usePlayNewSermon,
} from 'entities/player'
import { cacheUpdateTriggerAtom } from 'shared/lib/cache-triggers'
import { formatSermonReference } from 'shared/lib/format'
import { useTheme } from 'shared/ui/theme'
import { TracksListItem } from 'shared/ui/track-list'
import type { PlaylistData } from 'shared/model'
import { createStyles } from './PlaylistBottomSheet.styles'

interface PlaylistBottomSheetProps {
  closeOnBack?: boolean
  onClose: () => void
  playlist: null | PlaylistData
  sheetRef: React.RefObject<BottomSheet | null>
}

interface TrackListItemData {
  artwork?: string
  id: string
  subtitle?: string
  title: string
  url?: string
}

export const PlaylistBottomSheet = ({
  closeOnBack = true,
  onClose,
  playlist,
  sheetRef,
}: PlaylistBottomSheetProps) => {
  const [currentAudio] = useAtom(currentAudioAtom)
  const [downloadingUrl] = useAtom(downloadingAudioUrlAtom)
  const [isAudioPlaying] = useAtom(isPlayingAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)
  const playNewSermon = usePlayNewSermon()
  const { currentTheme } = useTheme()

  const handlePressItem = useCallback(
    async (index: number) => {
      if (!playlist) return
      const playlistList = playlist.sermons
      const sermon = playlistList[index]
      if (!sermon.audioUrl) return

      await playNewSermon({ playlist, sermon })
      sheetRef.current?.close()
      onClose()
    },
    [playlist, playNewSermon, sheetRef, onClose],
  )

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (closeOnBack && index === -1) onClose()
    },
    [closeOnBack, onClose],
  )

  const renderItem = useCallback(
    ({ index, item }: { index: number; item: TrackListItemData }) => (
      <TracksListItem
        title={item.title}
        audioUrl={item.url}
        artwork={item.artwork}
        subtitle={item.subtitle}
        cacheTrigger={cacheTrigger}
        downloadingUrl={downloadingUrl}
        onPress={() => handlePressItem(index)}
        isPlaying={currentAudio?.id === item.id}
        isAudioPlaying={currentAudio?.id === item.id && isAudioPlaying}
      />
    ),
    [cacheTrigger, currentAudio?.id, downloadingUrl, handlePressItem, isAudioPlaying],
  )

  const renderStyles = useMemo(() => createStyles(currentTheme), [currentTheme])

  const ItemSeparator = useCallback(() => <View style={renderStyles.divider} />, [renderStyles])

  if (!playlist) return null

  const tracksListData: TrackListItemData[] = playlist.sermons.map(sermon => ({
    artwork: playlist.artwork,
    id: sermon.id,
    subtitle: formatSermonReference({
      book: sermon.book,
      chapter: sermon.chapter,
      verse: sermon.verse,
    }),
    title: sermon.title,
    url: sermon.audioUrl ?? undefined,
  }))

  return (
    <BottomSheet
      ref={sheetRef}
      enablePanDownToClose
      snapPoints={['50%', '80%']}
      onChange={handleSheetChanges}
      backgroundStyle={renderStyles.background}
      handleIndicatorStyle={renderStyles.indicator}
      backdropComponent={props => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          pressBehavior='close'
          disappearsOnIndex={-1}
        />
      )}
    >
      <Text style={renderStyles.title}>{playlist.title}</Text>
      <BottomSheetFlatList
        data={tracksListData}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={renderStyles.listContent}
        keyExtractor={(item: TrackListItemData) => item.id}
      />
    </BottomSheet>
  )
}
