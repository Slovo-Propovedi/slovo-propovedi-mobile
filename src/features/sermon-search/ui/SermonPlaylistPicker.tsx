import { StyleSheet, Text, View } from 'react-native'
import { type PlaylistData } from 'entities/playlist'
import { TRACK_LIST_ITEM_SIZES } from 'entities/track-list'
import { CoverImage } from 'shared/ui/cover-image'
import { Modal } from 'shared/ui/modal'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'

const TITLE = 'Выберите плейлист'

/**
 * Bottom-sheet picker shown when a searched sermon belongs to several playlists.
 * Mirrors the add-to-playlist modal pattern (`shared/ui/modal`); guarded by the
 * caller's `visible`. Choosing a row starts playback in that playlist, the
 * backdrop closes without starting anything.
 * @param root0 - Picker props.
 * @param root0.onClose - Dismiss without playing.
 * @param root0.onSelect - Play the sermon within the chosen playlist.
 * @param root0.playlists - The sermon's playlists.
 * @param root0.visible - Whether the picker is shown.
 */
export const SermonPlaylistPicker = ({
  onClose,
  onSelect,
  playlists,
  visible,
}: {
  onClose: () => void
  onSelect: (playlist: PlaylistData) => void
  playlists: PlaylistData[]
  visible: boolean
}) => {
  const { currentTheme } = useTheme()

  return (
    <Modal visible={visible} onBackdropPress={onClose}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{TITLE}</Text>
        {playlists.map(playlist => (
          <PressableButton key={playlist.id} style={styles.row} onPress={() => onSelect(playlist)}>
            <CoverImage uri={playlist.artwork} style={styles.artwork} />
            <Text numberOfLines={1} style={[styles.rowTitle, { color: currentTheme.text }]}>
              {playlist.title}
            </Text>
          </PressableButton>
        ))}
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
