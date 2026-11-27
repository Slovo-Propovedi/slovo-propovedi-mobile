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
  /**
   * Top offset of the web spinner slot inside the scroll content, in px. In the
   * wide layout screens pass the island clearance so the slot sits right below
   * the floating chrome and above the first row. Native ignores it — the
   * scrollable's `RefreshControl` takes its own offset.
   * @default 0
   */
  topOffset?: number
}
