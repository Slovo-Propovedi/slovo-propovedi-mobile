import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { CoverImage, ProgressBar } from 'shared/ui'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/themed'
import type { SermonData } from 'shared/model'
import { formatScripture } from '../lib/formatScripture'

interface SermonSearchRowProps {
  onPress: () => void
  sermon: SermonData
  storedProgress?: number
}

export const SermonSearchRow = memo(({ onPress, sermon, storedProgress }: SermonSearchRowProps) => {
  const { currentTheme } = useTheme()
  const scripture = formatScripture(sermon)

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole='button'
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? currentTheme.surface : 'transparent' },
      ]}
    >
      <CoverImage uri={sermon.artwork} style={styles.artwork} />
      <View style={styles.texts}>
        <Text numberOfLines={2} style={[styles.title, { color: currentTheme.text }]}>
          {sermon.title}
        </Text>
        <Text numberOfLines={1} style={[styles.artist, { color: currentTheme.textMuted }]}>
          {sermon.artist}
        </Text>
        {scripture !== null && (
          <Text numberOfLines={1} style={[styles.scripture, { color: currentTheme.textMuted }]}>
            {scripture}
          </Text>
        )}
      </View>
      {storedProgress != null && storedProgress > 0 && <ProgressBar progress={storedProgress} />}
    </Pressable>
  )
})

const styles = StyleSheet.create({
  artist: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.lowest,
  },
  artwork: {
    borderRadius: RADIUSES.low,
    height: 48,
    width: 48,
  },
  row: {
    alignItems: 'center',
    borderRadius: RADIUSES.middle,
    flexDirection: 'row',
    marginHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  scripture: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.lowest,
  },
  texts: {
    flex: 1,
    marginLeft: INDENTS.middle,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
})
