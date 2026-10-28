import { StyleSheet, Text, View } from 'react-native'
import { type PlaylistData } from 'entities/playlist'
import { TRACK_LIST_ITEM_SIZES } from 'entities/track-list'
import { CoverImage } from 'shared/ui/cover-image'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme, withAlpha } from 'shared/ui/theme'

const HIGHLIGHT_TINT_OPACITY = 0.08
const HIGHLIGHT_BORDER_OPACITY = 0.5

interface PlaybackChoiceRowProps {
  caption?: string
  highlighted?: boolean
  onSelect: () => void
  playlist: PlaylistData
}

/**
 * One row of the chooser. A special row (the playback origin or the offline
 * collection) is tinted with the primary color and may carry a secondary
 * caption line.
 * @param root0 - Row props.
 * @param root0.caption - Secondary line shown under the playlist title.
 * @param root0.highlighted - Whether the row is tinted as a special one.
 * @param root0.onSelect - Play in this playlist.
 * @param root0.playlist - Playlist shown by the row.
 */
export const PlaybackChoiceRow = ({
  caption,
  highlighted,
  onSelect,
  playlist,
}: PlaybackChoiceRowProps) => {
  const { currentTheme } = useTheme()

  return (
    <PressableButton
      onPress={onSelect}
      style={[
        styles.row,
        highlighted && {
          backgroundColor: withAlpha(currentTheme.primary, HIGHLIGHT_TINT_OPACITY),
          borderColor: withAlpha(currentTheme.primary, HIGHLIGHT_BORDER_OPACITY),
          borderRadius: RADIUSES.low,
          borderWidth: 1,
          paddingHorizontal: INDENTS.low,
        },
      ]}
    >
      <CoverImage uri={playlist.artwork} style={styles.artwork} />
      <View style={styles.texts}>
        <Text numberOfLines={1} style={[styles.rowTitle, { color: currentTheme.text }]}>
          {playlist.title}
        </Text>
        {caption ? (
          <Text numberOfLines={1} style={[styles.caption, { color: currentTheme.textMuted }]}>
            {caption}
          </Text>
        ) : null}
      </View>
    </PressableButton>
  )
}

const styles = StyleSheet.create({
  artwork: {
    borderRadius: RADIUSES.low,
    height: TRACK_LIST_ITEM_SIZES.albumArtSize,
    width: TRACK_LIST_ITEM_SIZES.albumArtSize,
  },
  caption: {
    fontSize: FONT_SIZES.sm,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  rowTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  texts: {
    flex: 1,
  },
})
