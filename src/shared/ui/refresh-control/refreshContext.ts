import { createContext } from 'react'
import { type SharedValue } from 'react-native-reanimated'

/**
 * Refresh handler of the nearest web `PullToRefresh`: lets a header
 * `RefreshButton` trigger the same reload without prop drilling.
 *
 * `pullProgress` is the live 0..1 gesture progress, so the wide top-actions
 * overlay can fade its spinner in during the pull without a re-render per move.
 */
export const RefreshContext = createContext<{
  /** Pull passed the trigger threshold, or a refresh is running. */
  isArmed?: boolean
  onRefresh: () => Promise<void> | void
  /** Absent in synthetic providers (e.g. Admin list headers). */
  pullProgress?: SharedValue<number>
  refreshing: boolean
} | null>(null)
