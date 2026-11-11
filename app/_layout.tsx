import { reatomContext } from '@reatom/npm-react'
import { type SuspenseFallbackProps } from 'expo-router'
import { type ReactNode } from 'react'
import { ActivityIndicator, Platform, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context'
import { watchSessionExpiry } from 'entities/auth'
import { fetchMyFeatureFlags, hydrateCachedFeatureFlags } from 'entities/feature-flags'
import { loadHistoryAction } from 'entities/listening-history'
import {
  cleanupOrphanedDownloads,
  hydrateOfflineRegistry,
  loadSermonCachingEnabled,
  reEnqueuePartialDownloads,
  resumeAudioManifestMigration,
} from 'entities/offline-cache'
import { initializePlayer, scheduleStartupGuardReset } from 'entities/player'
import { hydrateCachedSections } from 'entities/section'
import { ctx } from 'shared/lib/reatom-ctx'
import { initServerUrlAction, loadHapticsEnabled, loadToursDisabled } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { ErrorBoundary, GlobalErrorHandler } from 'shared/ui/error-dialog'
import { useKeyboardBottomInsetSync } from 'shared/ui/layout'
import { COLORS, NavThemeProvider, ThemeProvider, useTheme } from 'shared/ui/theme'
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

// expo-router 58 mounts a frozen-zero WebSafeAreaProvider on web, so useSafeAreaInsets()
// returns zeros there and every header, overlay and bottom padding sits under the iOS
// status bar / home indicator in the PWA. On web we mount the library's own provider
// above the router instead: it measures env(safe-area-inset-*) through a probe and feeds
// all consumers (react-navigation headers included, since its SafeAreaProviderCompat
// skips wrapping once a parent insets context exists). Expo's SSR-hydration caution
// about a second web provider does not apply here — the web build is a client-only SPA,
// not a streamed server render. Native keeps expo-router's provider untouched.
// `initialWindowMetrics` is null on web, which is exactly the provider's default; the
// probe fills in the measured insets right after mount.
const SafeAreaBoundary = ({ children }: { children: ReactNode }) =>
  Platform.OS === 'web' ? (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>{children}</SafeAreaProvider>
  ) : (
    <>{children}</>
  )

const RootLayoutWithProvider = () => {
  useKeyboardBottomInsetSync()

  return (
    <reatomContext.Provider value={ctx}>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ErrorBoundary>
            <NavThemeProvider>
              <GlobalErrorHandler />
              <SafeAreaBoundary>
                <RootLayout />
              </SafeAreaBoundary>
            </NavThemeProvider>
          </ErrorBoundary>
        </GestureHandlerRootView>
      </ThemeProvider>
    </reatomContext.Provider>
  )
}

// Purge orphaned legacy .mp3.part files, verify legacy web-cache entries,
// hydrate the offline registry, restore the player, then re-enqueue stale
// .cache.mp3 partials. Sweeping after restore keeps the current track's partial
// alive for an offline resolve; a same-URL enqueue joins the existing queue
// entry. The caching setting loads INSIDE the chain and BEFORE the player
// restore: both downstream steps enqueue downloads through the queue gate
// (restore → resolvePlaybackUrl → startBackgroundCaching → enqueueCache, then
// reEnqueuePartialDownloads), and the gate reads the atom — with the default
// `true` still in place a cold start would start a download on every launch
// despite the setting being off.
// Each step is isolated: a failure in offline-registry hydration or in loading
// the caching setting must not abort the chain before the player restore runs
// (otherwise cold start silently leaves currentAudio empty). The terminal
// catch reports any rejection that still escapes.
void cleanupOrphanedDownloads()
  .catch(error => console.error('[audio-cache] orphan cleanup failed:', error))
  .then(() => resumeAudioManifestMigration())
  .catch(error => console.error('[audio-cache] manifest migration failed:', error))
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
// The watcher lives for the whole process: a revoked session (refresh rejected)
// must drop the stale authenticated shell even before /admin is opened.
watchSessionExpiry(ctx)
void initServerUrlAction(ctx)
void loadHapticsEnabled(ctx)
void loadToursDisabled(ctx)
void loadHistoryAction(ctx)
void hydrateCachedSections(ctx)
void hydrateCachedFeatureFlags(ctx).then(() => fetchMyFeatureFlags(ctx))

export default RootLayoutWithProvider

const styles = {
  container: {
    alignItems: 'center' as const,
    flex: 1,
    justifyContent: 'center' as const,
  },
}
