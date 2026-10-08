import { reatomContext } from '@reatom/npm-react'
import { type SuspenseFallbackProps } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context'
import { loadHistoryAction } from 'entities/listening-history'
import {
  cleanupOrphanedDownloads,
  hydrateOfflineRegistry,
  loadSermonCachingEnabled,
  reEnqueuePartialDownloads,
} from 'entities/offline-cache'
import { initializePlayer, scheduleStartupGuardReset } from 'entities/player'
import { hydrateCachedSections } from 'entities/section'
import { ctx } from 'shared/lib/reatom-ctx'
import { initServerUrlAction, loadHapticsEnabled } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { ErrorBoundary, GlobalErrorHandler } from 'shared/ui/error-dialog'
import { COLORS, ThemeProvider, useTheme } from 'shared/ui/theme'
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
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ErrorBoundary>
            <GlobalErrorHandler />
            <RootLayout />
          </ErrorBoundary>
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  </reatomContext.Provider>
)

// Purge orphaned legacy .mp3.part files, hydrate the offline registry, restore
// the player, then re-enqueue stale .cache.mp3 partials. Sweeping after restore
// keeps the current track's partial alive for an offline resolve; a same-URL
// enqueue joins the existing queue entry. The caching setting loads INSIDE the
// chain and BEFORE the player restore: both downstream steps enqueue downloads
// through the queue gate (restore → resolvePlaybackUrl → startBackgroundCaching →
// enqueueCache, then reEnqueuePartialDownloads), and the gate reads the atom —
// with the default `true` still in place a cold start would start a download on
// every launch despite the setting being off.
// Each step is isolated: a failure in offline-registry hydration or in loading
// the caching setting must not abort the chain before the player restore runs
// (otherwise cold start silently leaves currentAudio empty). The terminal
// catch reports any rejection that still escapes.
void cleanupOrphanedDownloads()
  .catch(error => console.error('[audio-cache] orphan cleanup failed:', error))
  .then(() => hydrateOfflineRegistry(ctx))
  .catch(error => console.error('[startup] offline registry hydration failed:', error))
  .then(() => loadSermonCachingEnabled(ctx))
  .catch(error => console.error('[startup] caching setting load failed:', error))
  .then(() => initializePlayer())
  .then(() => reEnqueuePartialDownloads(ctx))
  .catch(error => {
    console.error('[startup] chain failed:', error)
    reportError(error, 'Ошибка при инициализации приложения')
  })
scheduleStartupGuardReset()
void initServerUrlAction(ctx)
void loadHapticsEnabled(ctx)
void loadHistoryAction(ctx)
void hydrateCachedSections(ctx)

export default RootLayoutWithProvider

const styles = {
  container: {
    alignItems: 'center' as const,
    flex: 1,
    justifyContent: 'center' as const,
  },
}
