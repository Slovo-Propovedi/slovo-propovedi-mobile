import { reatomContext } from '@reatom/npm-react'
import { type SuspenseFallbackProps } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { loadHistoryAction } from 'entities/listening-history'
import { initializePlayer } from 'entities/player'
import { initServerUrlAction } from 'entities/settings'
import { ctx } from 'shared/lib/reatom-ctx'
import { ErrorBoundary, GlobalErrorHandler } from 'shared/ui/error-dialog'
import { ThemeProvider } from 'shared/ui/theme'
import { COLORS, useTheme } from 'shared/ui/themed'
import RootLayout from './_RootLayout'

/**
 * Fallback component shown while the root layout's route content is loading via Suspense.
 * @param _props - Standard Suspense fallback props (unused).
 */
export function SuspenseFallback(_props: SuspenseFallbackProps) {
  const { currentTheme } = useTheme()

  return (
    <View style={{ ...styles.container, backgroundColor: currentTheme.background }}>
      <ActivityIndicator size='large' color={COLORS.primary} />
    </View>
  )
}

const RootLayoutWithProvider = () => (
  <reatomContext.Provider value={ctx}>
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <GlobalErrorHandler />
          <RootLayout />
        </ErrorBoundary>
      </GestureHandlerRootView>
    </ThemeProvider>
  </reatomContext.Provider>
)

void initializePlayer()
void initServerUrlAction(ctx)
void loadHistoryAction(ctx)

export default RootLayoutWithProvider

const styles = {
  container: {
    alignItems: 'center' as const,
    flex: 1,
    justifyContent: 'center' as const,
  },
}
