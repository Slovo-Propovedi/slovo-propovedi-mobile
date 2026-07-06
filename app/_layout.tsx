import { reatomContext } from '@reatom/npm-react'
import { type SuspenseFallbackProps } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { initializePlayer } from 'entities/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { ErrorBoundary, GlobalErrorHandler } from 'shared/ui/error-dialog'
import { COLORS } from 'shared/ui/themed'
import RootLayout from './_RootLayout'

/**
 * Fallback component shown while the root layout's route content is loading via Suspense.
 * @param _props - Standard Suspense fallback props (unused).
 */
export function SuspenseFallback(_props: SuspenseFallbackProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size='large' color={COLORS.primary} />
    </View>
  )
}

const RootLayoutWithProvider = () => (
  <reatomContext.Provider value={ctx}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <GlobalErrorHandler />
        <RootLayout />
      </ErrorBoundary>
    </GestureHandlerRootView>
  </reatomContext.Provider>
)

void initializePlayer()

export default RootLayoutWithProvider

const styles = {
  container: {
    alignItems: 'center' as const,
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center' as const,
  },
}
