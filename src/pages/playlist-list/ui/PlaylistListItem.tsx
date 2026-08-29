import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from 'shared/config'
import { CoverImage, MarqueeText } from 'shared/ui'
import { type ThemeColors } from 'shared/ui/theme'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import type { PlaylistData } from 'shared/model'

export const ALBUM_ART_SIZE = SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.25

interface PlaylistListItemProps {
  onPress: () => void
  playlist: PlaylistData
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    albumArt: {
      borderRadius: RADIUSES.low,
      height: ALBUM_ART_SIZE,
      width: ALBUM_ART_SIZE,
    },
    albumArtContainer: {
      marginRight: INDENTS.medium,
      position: 'relative',
    },
    description: {
      color: theme.textMuted,
      fontSize: FONT_SIZES.md,
      marginTop: INDENTS.low,
    },
    itemContainer: {
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: RADIUSES.middle,
      flexDirection: 'row',
      paddingHorizontal: INDENTS.medium,
      paddingVertical: INDENTS.medium,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      color: theme.text,
      fontSize: FONT_SIZES.h3,
      fontWeight: '600',
    },
  })

export const PlaylistListItem = ({ onPress, playlist }: PlaylistListItemProps) => {
  const { currentTheme } = useTheme()
  const styles = createStyles(currentTheme)

  return (
    <Pressable onPress={onPress} style={styles.itemContainer}>
      <View style={styles.albumArtContainer}>
        <CoverImage uri={playlist.artwork} style={styles.albumArt} />
      </View>
      <View style={styles.textContainer}>
        <MarqueeText text={playlist.title} textStyle={styles.title} />
        {playlist.description && (
          <Text numberOfLines={1} style={styles.description}>
            {playlist.description}
          </Text>
        )}
      </View>
    </Pressable>
  )
}
