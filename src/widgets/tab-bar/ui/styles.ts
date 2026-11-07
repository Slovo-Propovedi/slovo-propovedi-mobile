import { BAR_SIDE_INSET, CONTENT_COLUMN_WIDTH } from 'shared/ui/layout'
import { MIN_TOUCH_TARGET, RADIUSES } from 'shared/ui/theme'
import { CAPSULE_HORIZONTAL_OVERHANG, TAB_ITEM_GAP } from '../lib/getIslandStyle'

export const ISLAND_BACKGROUND_LIGHT = 'rgba(230, 230, 230, 0.9)'
export const ISLAND_BACKGROUND_DARK = 'rgba(0, 0, 0, 0.85)'

const TAB_LABEL_BOTTOM = 4

export const styles = {
  blurFill: {
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    top: 0,
  },
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
    elevation: 12,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    zIndex: 10,
  },
  floatingIsland: {
    borderRadius: RADIUSES.round,
    // No static height: the animated morph style (getIslandStyle) owns it. A
    // static height in the same style array shadows the animated property on
    // device/web, pinning the expanded island to the collapsed 64.
    // Floating chrome stays a centered 600px column on wide screens (tablets, desktop-web).
    maxWidth: CONTENT_COLUMN_WIDTH,
    overflow: 'hidden' as const,
  },
  islandContent: {
    alignItems: 'center' as const,
    flex: 1,
    flexDirection: 'row' as const,
    height: '100%' as const,
  },
  // Fixed-height row keeps the measured tab-bar height stable across the morph;
  // only the island inside it changes width.
  islandsRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    maxWidth: CONTENT_COLUMN_WIDTH,
    paddingHorizontal: BAR_SIDE_INSET,
    width: '100%' as const,
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
    justifyContent: 'center' as const,
    marginHorizontal: TAB_ITEM_GAP / 2,
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
