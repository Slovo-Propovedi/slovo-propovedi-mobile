import { FlatList, StyleSheet, Text, View } from 'react-native'
import { type PlaylistData } from 'entities/playlist'
import { TRACK_LIST_ITEM_SIZES } from 'entities/track-list'
import { CoverImage } from 'shared/ui/cover-image'
import { Modal } from 'shared/ui/modal'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'

const TITLE = 'Где воспроизвести проповедь?'
const OFFLINE_OPTION_TEXT = 'Все офлайн-проповеди'
const MAX_LIST_HEIGHT = 360

/**
 * Chooser shown when a sermon belongs to several playlists. When an offline
 * collection is provided, the first row plays the whole offline set; the
 * following rows are the real playlists holding the sermon. Backdrop closes
 * without starting anything.
 * @param root0 - Dialog props.
 * @param root0.candidates - Real playlists containing the sermon.
 * @param root0.offlinePlaylist - Optional pseudo-playlist of all offline sermons.
 * @param root0.onClose - Dismiss without playing.
 * @param root0.onSelect - Play in the chosen playlist.
 * @param root0.visible - Whether the chooser is shown.
 */
export const PlaybackChoiceDialog = ({
  candidates,
  offlinePlaylist,
  onClose,
  onSelect,
  visible,
}: {
  candidates: PlaylistData[]
  offlinePlaylist?: PlaylistData
  onClose: () => void
  onSelect: (playlist: PlaylistData) => void
  visible: boolean
}) => {
  const { currentTheme } = useTheme()

  return (
    <Modal visible={visible} onBackdropPress={onClose}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{TITLE}</Text>
        <FlatList
          data={candidates}
          style={styles.list}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            offlinePlaylist ? (
              <PressableButton style={styles.row} onPress={() => onSelect(offlinePlaylist)}>
                <Text style={[styles.rowTitle, { color: currentTheme.text }]}>
                  {OFFLINE_OPTION_TEXT}
                </Text>
              </PressableButton>
            ) : undefined
          }
          renderItem={({ item }) => (
            <PressableButton style={styles.row} onPress={() => onSelect(item)}>
              <CoverImage uri={item.artwork} style={styles.artwork} />
              <Text numberOfLines={1} style={[styles.rowTitle, { color: currentTheme.text }]}>
                {item.title}
              </Text>
            </PressableButton>
          )}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  artwork: {
    borderRadius: RADIUSES.low,
    height: TRACK_LIST_ITEM_SIZES.albumArtSize,
    width: TRACK_LIST_ITEM_SIZES.albumArtSize,
  },
  container: {
    minWidth: '100%',
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.medium,
  },
  list: {
    maxHeight: MAX_LIST_HEIGHT,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  rowTitle: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    paddingBottom: INDENTS.medium,
  },
})
