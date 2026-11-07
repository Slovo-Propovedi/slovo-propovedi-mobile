import {
  BAR_CIRCLE_SIZE,
  BAR_SIDE_INSET,
  CONTENT_COLUMN_WIDTH,
  TAB_BAR_ISLAND_HEIGHT,
} from 'shared/ui/layout'
import { RADIUSES } from 'shared/ui/theme'

export const ISLAND_BACKGROUND_LIGHT = 'rgba(230, 230, 230, 0.9)'
export const ISLAND_BACKGROUND_DARK = 'rgba(0, 0, 0, 0.85)'

export const styles = {
  blurFill: {
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    top: 0,
  },
  circleButton: {
    alignItems: 'center' as const,
    borderRadius: RADIUSES.round,
    height: BAR_CIRCLE_SIZE,
    justifyContent: 'center' as const,
    width: BAR_CIRCLE_SIZE,
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
    // Floating chrome stays a centered 600px column on wide screens (tablets, desktop-web).
    height: TAB_BAR_ISLAND_HEIGHT,
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
  },
  tabItem: {
    alignItems: 'center' as const,
    borderRadius: RADIUSES.round,
    flex: 1,
    justifyContent: 'center' as const,
    margin: 4,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 2,
  },
}
