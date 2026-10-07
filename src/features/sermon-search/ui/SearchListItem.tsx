import { StyleSheet, Text, View } from 'react-native'
import { TRACK_LIST_ITEM_SIZES } from 'entities/track-list'
import { CoverImage } from 'shared/ui/cover-image'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'

/**
 * Playlist/preacher search row. Geometry (padding, radius, 50px artwork, title
 * and subtitle typography, min height) mirrors TracksListItem exactly so all
 * three search groups share the same row height — without pulling in the track
 * row's cache badge and dots menu, which do not apply to playlists/preachers.
 * @param root0 - Row props.
 * @param root0.artwork - Cover URI; omitted rows (preachers) keep the track row height via a min-height text column.
 * @param root0.onPress - Row press handler.
 * @param root0.subtitle - Optional playlist-style secondary line.
 * @param root0.title - Primary row label.
 */
export const SearchListItem = ({
  artwork,
  onPress,
  subtitle,
  title,
}: {
  artwork?: null | string
  onPress: () => void
  subtitle?: string
  title: string
}) => {
  const { currentTheme } = useTheme()

  return (
    <PressableButton onPress={onPress} style={[styles.row, { backgroundColor: currentTheme.card }]}>
      {artwork == null ? null : <CoverImage uri={artwork} style={styles.artwork} />}
      <View style={styles.texts}>
        <Text numberOfLines={1} style={[styles.title, { color: currentTheme.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[styles.subtitle, { color: currentTheme.textMuted }]}>
            {subtitle}
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
    marginRight: INDENTS.middle,
    width: TRACK_LIST_ITEM_SIZES.albumArtSize,
  },
  row: {
    alignItems: 'center',
    borderRadius: RADIUSES.middle,
    flexDirection: 'row',
    paddingHorizontal: INDENTS.middle,
    paddingVertical: INDENTS.middle,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    marginTop: INDENTS.lowest,
  },
  texts: {
    flex: 1,
    justifyContent: 'center',
    // Keeps rows without artwork (preachers) as tall as artwork rows, matching
    // TracksListItem's album-art-driven height.
    minHeight: TRACK_LIST_ITEM_SIZES.albumArtSize,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
})
