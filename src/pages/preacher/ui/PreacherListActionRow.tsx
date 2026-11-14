import { StyleSheet, Text } from 'react-native'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'

export const PreacherListActionRow = ({
  label,
  onPress,
}: {
  label: string
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={onPress}
      style={[styles.row, { backgroundColor: currentTheme.surface }]}
    >
      <Text style={[styles.label, { color: currentTheme.primary }]}>{label}</Text>
    </TouchableItem>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: FONT_SIZES.base },
  row: { alignItems: 'center', paddingVertical: INDENTS.medium },
})
