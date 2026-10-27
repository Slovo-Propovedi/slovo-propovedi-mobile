import { createContext } from 'react'

/**
 * Refresh handler of the nearest web `PullToRefresh`: lets a header
 * `RefreshButton` trigger the same reload without prop drilling.
 */
export const RefreshContext = createContext<{
  onRefresh: () => Promise<void> | void
  refreshing: boolean
} | null>(null)
