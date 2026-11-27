import { type ReactNode } from 'react'

/**
 * Props of the cross-platform pull-to-refresh wrapper.
 *
 * Native resolves `PullToRefresh.native.tsx` (a passthrough — the scrollable's
 * own `RefreshControl` from `createRefreshControl` does the work); web resolves
 * `PullToRefresh.tsx`, which adds a touch-driven gesture.
 */
export interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void> | void
  refreshing: boolean
}
