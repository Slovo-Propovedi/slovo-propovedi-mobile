import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'

// Заглушка раздела админки, ещё не реализованного (см. docs/debt.md).
export const AdminPlaylistsScreen = () => {
  const { currentTheme } = useTheme()

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Плейлисты</Text>
        <Text style={[styles.message, { color: currentTheme.textMuted }]}>Раздел в разработке</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    gap: INDENTS.low,
    justifyContent: 'center',
    padding: INDENTS.high,
  },
  message: {
    fontSize: FONT_SIZES.base,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
})
