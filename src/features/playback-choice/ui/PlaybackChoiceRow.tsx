import { StyleSheet, Text, View } from 'react-native'
import { type PlaylistData } from 'entities/playlist'
import { TRACK_LIST_ITEM_SIZES } from 'entities/track-list'
import { CoverImage } from 'shared/ui/cover-image'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme, withAlpha } from 'shared/ui/theme'

const ORIGIN_TINT_OPACITY = 0.08
const ORIGIN_BORDER_OPACITY = 0.5

interface PlaybackChoiceRowProps {
  isOrigin: boolean
  onSelect: () => void
  originLabel?: string
  playlist: PlaylistData
}

/**
 * One playlist candidate of the chooser. The playlist the sermon was played
 * from is tinted with the primary color and carries a secondary caption line.
 * @param root0 - Row props.
 * @param root0.isOrigin - Whether this candidate is the playback origin.
 * @param root0.onSelect - Play in this playlist.
 * @param root0.originLabel - Caption shown on the origin row.
 * @param root0.playlist - Candidate playlist.
 */
export const PlaybackChoiceRow = ({
  isOrigin,
  onSelect,
  originLabel,
  playlist,
}: PlaybackChoiceRowProps) => {
  const { currentTheme } = useTheme()

  return (
    <PressableButton
      onPress={onSelect}
      style={[
        styles.row,
        isOrigin && {
          backgroundColor: withAlpha(currentTheme.primary, ORIGIN_TINT_OPACITY),
          borderColor: withAlpha(currentTheme.primary, ORIGIN_BORDER_OPACITY),
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
        {isOrigin && originLabel ? (
          <Text numberOfLines={1} style={[styles.originLabel, { color: currentTheme.textMuted }]}>
            {originLabel}
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
  originLabel: {
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
