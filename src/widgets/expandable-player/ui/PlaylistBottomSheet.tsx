import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { useAtom } from '@reatom/npm-react'
import React, { useCallback } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TracksListItem } from 'widgets/track-list'
import { currentAudioAtom, isPlayingAtom, usePlayNewSermon } from 'entities/player'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/themed'
import type { PlaylistData } from 'shared/model'

interface PlaylistBottomSheetProps {
  onClose: () => void
  playlist: null | PlaylistData
  sheetRef: React.RefObject<BottomSheet | null>
}

interface TrackListItemData {
  artist: string
  artwork?: string
  id: string
  title: string
  url?: string
}

export const PlaylistBottomSheet = ({ onClose, playlist, sheetRef }: PlaylistBottomSheetProps) => {
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isAudioPlaying] = useAtom(isPlayingAtom)
  const playNewSermon = usePlayNewSermon()

  const tracksListData: TrackListItemData[] = (playlist?.list ?? []).map(sermon => ({
    artist: sermon.artist || 'Слово.Проповеди',
    artwork: playlist?.artwork,
    id: sermon.id,
    title: sermon.title,
    url: sermon.audioUrl,
  }))

  const handlePressItem = useCallback(
    async (index: number) => {
      if (!playlist) return
      const sermon = playlist.list[index]
      if (!sermon.audioUrl) return

      await playNewSermon({ playlist, sermon })
      sheetRef.current?.close()
      onClose()
    },
    [playlist, playNewSermon, sheetRef, onClose],
  )

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onClose()
    },
    [onClose],
  )

  const renderItem = useCallback(
    ({ index, item }: { index: number; item: TrackListItemData }) => (
      <TracksListItem
        title={item.title}
        audioUrl={item.url}
        artist={item.artist}
        artwork={item.artwork}
        onPress={() => handlePressItem(index)}
        isPlaying={currentAudio?.id === item.id}
        isAudioPlaying={currentAudio?.id === item.id && isAudioPlaying}
      />
    ),
    [currentAudio?.id, handlePressItem, isAudioPlaying],
  )

  const ItemSeparator = useCallback(() => <View style={styles.divider} />, [])

  if (!playlist) return null

  return (
    <BottomSheet
      ref={sheetRef}
      enablePanDownToClose
      snapPoints={['50%', '80%']}
      onChange={handleSheetChanges}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
      backdropComponent={props => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          pressBehavior='close'
          disappearsOnIndex={-1}
        />
      )}
    >
      <Text style={styles.title}>{playlist.title}</Text>
      <BottomSheetFlatList
        data={tracksListData}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item: TrackListItemData) => item.id}
      />
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'rgba(37, 37, 37, 0.8)',
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 1,
  },
  indicator: {
    backgroundColor: COLORS.textMuted,
  },
  listContent: {
    paddingBottom: INDENTS.medium,
    paddingHorizontal: INDENTS.medium,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    paddingBottom: INDENTS.medium,
    paddingHorizontal: INDENTS.medium,
  },
})
