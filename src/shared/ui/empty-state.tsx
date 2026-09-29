import { StyleSheet, Text, View } from 'react-native'
import { COLORS } from './theme/colors'
import { FONT_SIZES } from './theme/themed'

export const EmptyState = ({ message = 'Здесь ничего нет' }: { message?: string }) => (
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
