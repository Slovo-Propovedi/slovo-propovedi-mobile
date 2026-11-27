import { useBarBottomPadding, useChromeLayoutShift } from 'shared/ui/layout'

/**
 * Slide of the mini pill between its compact and wide rests. In compact the pill
 * floats one bottom-anchored tab row above the screen bottom; in wide it rests
 * on the chrome's bottom padding. The difference is the pill's old offset, so
 * the pill descends INTO wide and rises back OUT of it.
 * @param tabBarHeight - Measured height of the floating tab row.
 */
export const useMiniPillShiftTranslateY = (tabBarHeight: number) => {
  const wideBottomInset = useBarBottomPadding()

  return useChromeLayoutShift({
    distance: tabBarHeight - wideBottomInset,
    wideAnchorSign: -1,
  }).translateY
}
