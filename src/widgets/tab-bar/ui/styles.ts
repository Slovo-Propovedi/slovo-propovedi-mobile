import { CONTENT_COLUMN_WIDTH } from 'shared/ui/layout'
import { MIN_TOUCH_TARGET, RADIUSES } from 'shared/ui/theme'
import { CAPSULE_HORIZONTAL_OVERHANG } from '../lib/getIslandStyle'

const TAB_LABEL_BOTTOM = 4

export const styles = {
  // Background layer of the active tab highlight; its opacity follows the morph
  // so the collapsed circle never shows the capsule. Overhanging the slot keeps
  // the active label away from the rounded capsule ends.
  capsule: {
    borderRadius: RADIUSES.round,
    bottom: 0,
    left: -CAPSULE_HORIZONTAL_OVERHANG,
    position: 'absolute' as const,
    right: -CAPSULE_HORIZONTAL_OVERHANG,
    top: 0,
  },
  circleButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  circleButtonFill: {
    alignItems: 'center' as const,
    borderRadius: RADIUSES.round,
    flex: 1,
    justifyContent: 'center' as const,
    width: '100%' as const,
  },
  disabledTabButton: {
    opacity: 0.5,
  },
  floatingContainer: {
    alignItems: 'center' as const,
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    zIndex: 10,
  },
  // Wide layout: the chrome floats at the top of the screen. No `bottom` here —
  // setting both edges would stretch the container.
  floatingContainerTop: {
    alignItems: 'center' as const,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    zIndex: 10,
  },
  floatingIsland: {
    borderRadius: RADIUSES.round,
    // No static height: the animated morph style (getIslandStyle) owns it. A
    // static height in the same style array shadows the animated property on
    // device/web, pinning the expanded island to the collapsed 48.
    // Floating chrome stays a centered 600px column on wide screens (tablets, desktop-web).
    maxWidth: CONTENT_COLUMN_WIDTH,
    // No overflow here: the glass surface clips itself, and the tab content is
    // clipped by islandContent below. A host-level clip is the Safari-fragile
    // pattern (Issue #152) and is unnecessary.
  },
  islandContent: {
    alignItems: 'center' as const,
    // The clip lives on the content wrapper, not the island host (Issue #152):
    // on iPad Safari the slot animated styles can freeze at the expanded
    // geometry mid-morph, and a host-level overflow+border-radius fails to
    // clip composited children — the frozen tabs then paint outside the pill.
    borderRadius: RADIUSES.round,
    flex: 1,
    flexDirection: 'row' as const,
    height: '100%' as const,
    overflow: 'hidden' as const,
  },
  // Fixed-height row keeps the measured tab-bar height stable across the morph;
  // only the island inside it changes width. The island anchors to the content
  // box's bottom edge so its silhouette sits flush on the safe-area line
  // (Issue #153), never floating above it by the leftover centering space.
  // The horizontal padding is NOT static: useRowInsetStyle animates it between
  // the expanded and the one-line side insets (longhand paddings only — an
  // animated paddingHorizontal never reaches the web DOM).
  // zIndex 1 keeps the row above the z-auto screens on web (document order only
  // ranks positioned siblings); SearchIslandMorph (zIndex 20) and the pill's
  // later subtree (zIndex 300) stay above.
  islandsRow: {
    alignItems: 'flex-end' as const,
    // Поднятый ряд рисует острова над контентом экранов.
    elevation: 12,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    maxWidth: CONTENT_COLUMN_WIDTH,
    position: 'relative' as const,
    width: '100%' as const,
    zIndex: 1,
  },
  tabButton: {
    flex: 1,
    // Guards the 48dp touch target on the narrowest phones; the slot width from
    // getTabSlotStyle also stays above MIN_TOUCH_TARGET while expanded.
    minHeight: MIN_TOUCH_TARGET,
  },
  tabItem: {
    alignItems: 'center' as const,
    borderRadius: RADIUSES.round,
    // No static height and no flex: the animated height (getTabItemHeight) owns
    // the item size. `flex: 1` would zero the flex basis and collapse the item
    // to its content, squeezing the icon and label.
    // Margins also live in the animated style: they fade out with the morph so
    // the collapsed active item fills the circle and centres its icon.
    justifyContent: 'center' as const,
    paddingVertical: 4,
  },
  // Absolute so the label never takes part in the slot's layout: the icon is
  // the only centred child and stays in the circle centre through the morph.
  tabText: {
    bottom: TAB_LABEL_BOTTOM,
    fontSize: 12,
    fontWeight: '500' as const,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    textAlign: 'center' as const,
  },
}
