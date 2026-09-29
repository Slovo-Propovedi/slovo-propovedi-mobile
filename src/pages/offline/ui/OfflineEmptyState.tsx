import { StyleSheet, Text, View } from 'react-native'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'

const CACHING_OFF_TITLE = 'Сохранение в офлайн отключено'
const CACHING_OFF_HINT = 'Включите тумблер в шапке экрана'
const NO_SERMONS_TITLE = 'Нет офлайн-проповедей'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  hint: {
    fontSize: FONT_SIZES.md,
    marginTop: INDENTS.lowest,
    textAlign: 'center',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
  },
})

// Empty state of the offline list. With caching switched off nothing can land
// here, so the list says WHY it is empty instead of a bare "empty" — and points
// at the header toggle that brings downloading back.
export const OfflineEmptyState = ({ isCachingEnabled }: { isCachingEnabled: boolean }) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: currentTheme.textMuted }]}>
        {isCachingEnabled ? NO_SERMONS_TITLE : CACHING_OFF_TITLE}
      </Text>
      {!isCachingEnabled && (
        <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{CACHING_OFF_HINT}</Text>
      )}
    </View>
  )
}
