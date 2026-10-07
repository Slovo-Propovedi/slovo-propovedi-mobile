import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { SearchGroupHeaderSkeleton } from './SearchGroupHeaderSkeleton'

export const SearchGroupHeader = ({
  count,
  label,
  onPress,
}: {
  count: number
  label: string
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <Pressable
      onPress={onPress}
      style={styles.header}
      accessibilityRole='button'
      accessibilityLabel={`${label}, ${count}`}
    >
      <Text style={[styles.label, { color: currentTheme.text }]}>{label}</Text>
      <View style={styles.trailing}>
        <Text style={[styles.count, { color: currentTheme.textMuted }]}>{count}</Text>
        <Ionicons size={18} name='chevron-forward' color={currentTheme.textMuted} />
      </View>
    </Pressable>
  )
}

// The skeleton hangs off the header so its geometry cannot drift from the real row.
SearchGroupHeader.Skeleton = SearchGroupHeaderSkeleton

const styles = StyleSheet.create({
  count: {
    fontSize: FONT_SIZES.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  label: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  trailing: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
  },
})
