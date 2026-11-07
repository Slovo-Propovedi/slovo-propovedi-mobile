import { COLLAPSE_SCROLL_THRESHOLD, EXPAND_TOP_THRESHOLD } from '../bottomBarLayout'

// Shared threshold-crossing rule for the floating bottom bar's collapse.
//
// Returns the next collapsed state when the scroll offset crosses a threshold,
// or `null` when the offset stays inside the hysteresis band or the result
// matches the state we already hold. Callers use that `null` to quantize:
// only a real crossing writes to the atom, so the band never schedules React
// work per scroll frame.
//
// Declared as a worklet so animated scroll handlers can call it on the UI
// thread; plain JS scroll adapters (e.g. `onScrollOffsetChange`) may call it
// directly too.
export const nextBarCollapsedState = (offsetY: number, wasCollapsed: boolean): boolean | null => {
  'worklet'

  let shouldCollapse = wasCollapsed
  if (offsetY > COLLAPSE_SCROLL_THRESHOLD) shouldCollapse = true
  else if (offsetY <= EXPAND_TOP_THRESHOLD) shouldCollapse = false

  return shouldCollapse === wasCollapsed ? null : shouldCollapse
}
