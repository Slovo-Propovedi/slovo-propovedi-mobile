import { type PullToRefreshProps } from './pull-to-refresh.types'

/**
 * Native passthrough: iOS/Android already get pull-to-refresh from the
 * scrollable's own `RefreshControl` (see `createRefreshControl`), so the
 * wrapper only forwards its children.
 * @param root0 - Component props.
 * @param root0.children - Scrollable content rendered untouched.
 */
export const PullToRefresh = ({ children }: PullToRefreshProps) => <>{children}</>
