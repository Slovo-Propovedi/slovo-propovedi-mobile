import { useAtom } from '@reatom/npm-react'
import { type RefObject, useEffect } from 'react'
import { useWindowDimensions, type ViewInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  searchCloseMorphDriver,
  searchFocusMorphDriver,
  searchOpenMorphDriver,
} from 'widgets/search-island/@x/morphDrivers'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import {
  isBarCollapsedAtom,
  isTabBarMeasuredAtom,
  keyboardBottomInsetSv,
  tabBarHeightAtom,
} from 'shared/ui/layout'
import { barMorphDriver } from '../model/barMorphDriver'
import { miniPillOpacitySv } from '../model/miniPillFade'

// DIAGNOSTIC: revert me — temporary logcat instrumentation for the shade box.
const SHADE_DEBUG = __DEV__

const round3 = (value: number) => +value.toFixed(3)

/**
 * DIAGNOSTIC: revert me. Dumps the shade's inputs and the measured box geometry
 * to the JS log on every commit, so a native cold start can be read from
 * `adb logcat -s ReactNativeJS:I`. `gap` is the distance from the box's bottom
 * edge to the window bottom: 0 is correct, positive reproduces the bug.
 * @param root0 - Shade inputs captured by the caller.
 * @param root0.hasPill - Whether this zone mounts the mini-player pill.
 * @param root0.expanded - Whether the player sheet is expanded.
 * @param root0.shadeRef - Ref to the animated shade box being measured.
 */
export const useShadeDebugLog = ({
  expanded,
  hasPill,
  shadeRef,
}: {
  expanded: boolean
  hasPill: boolean
  shadeRef: RefObject<null | ViewInstance>
}) => {
  const [isBarCollapsed] = useAtom(isBarCollapsedAtom)
  const { settled: barSettled } = useAtomMorphDriver(barMorphDriver)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const [isTabBarMeasured] = useAtom(isTabBarMeasuredAtom)
  const { bottom } = useSafeAreaInsets()
  const { height: winH } = useWindowDimensions()

  useEffect(() => {
    if (!SHADE_DEBUG) return

    console.log(
      '[shade]',
      JSON.stringify({
        barProg: round3(barMorphDriver.progress.value),
        barSettled,
        close: round3(searchCloseMorphDriver.progress.value),
        expanded,
        focus: round3(searchFocusMorphDriver.progress.value),
        hasPill,
        insetsB: bottom,
        isBarCollapsed,
        kb: +keyboardBottomInsetSv.value.toFixed(1),
        measured: isTabBarMeasured,
        open: round3(searchOpenMorphDriver.progress.value),
        pillOp: round3(miniPillOpacitySv.value),
        tbh: tabBarHeight,
        winH,
      }),
    )

    const frameId = requestAnimationFrame(() => {
      const shade = shadeRef.current
      if (!shade) return

      shade.measureInWindow((_x, y, _w, h) => {
        console.log(
          '[shade] box',
          JSON.stringify({ bottom: y + h, gap: winH - (y + h), h, winH, y }),
        )
      })
    })

    return () => cancelAnimationFrame(frameId)
  })
}
