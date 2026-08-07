import { StyleSheet, Text, View } from 'react-native'
import { COLORS, FONT_SIZES } from 'shared/ui/themed'

interface EmptyStateProps {
  message?: string
}

export const EmptyState = ({ message = 'Здесь ничего нет' }: EmptyStateProps) => (
  <View style={styles.container}>
    <Text style={styles.text}>{message}</Text>
  </View>
)

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  text: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.lg,
  },
})
