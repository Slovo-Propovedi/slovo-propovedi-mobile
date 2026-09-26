import { router, useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PressableButton } from 'shared/ui/pressable-button'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'

const TITLE = 'Страница не найдена'
const HOME_BUTTON_TITLE = 'На главный экран'
const HOME_ROUTE = '/listen'

const formatUnmatchedPath = (segments: string | string[] | undefined): null | string => {
  if (!segments) return null

  const parts = Array.isArray(segments) ? segments : [segments]
  if (parts.length === 0) return null

  return `/${parts.join('/')}`
}

export const NotFoundScreen = () => {
  const { currentTheme } = useTheme()
  const { 'not-found': unmatchedSegments } = useLocalSearchParams<{
    'not-found'?: string | string[]
  }>()
  const path = formatUnmatchedPath(unmatchedSegments)

  const handleGoHome = () => router.replace(HOME_ROUTE)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{TITLE}</Text>
        {path !== null && (
          <Text style={[styles.path, { color: currentTheme.textMuted }]}>{path}</Text>
        )}
        <PressableButton
          onPress={handleGoHome}
          accessibilityLabel={HOME_BUTTON_TITLE}
          style={[styles.button, { backgroundColor: currentTheme.primary }]}
        >
          <Text style={styles.buttonTitle}>{HOME_BUTTON_TITLE}</Text>
        </PressableButton>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUSES.low,
    marginTop: INDENTS.high,
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.middle,
  },
  buttonTitle: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  container: { flex: 1 },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: INDENTS.high,
  },
  path: {
    fontSize: FONT_SIZES.base,
    marginTop: INDENTS.low,
  },
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})
