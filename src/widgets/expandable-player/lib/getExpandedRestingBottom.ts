import { BAR_OUTER_GAP } from 'shared/ui/layout'

/**
 * Real resting bottom of the detached expanded mini-player: one outer gap above
 * the measured tab row. Used as the pan reference so a full swipe-up reaches the
 * same edge the pill rests at.
 * @param tabBarHeight - Measured height of the floating tab row.
 */
export const getExpandedRestingBottom = (tabBarHeight: number) => tabBarHeight + BAR_OUTER_GAP
