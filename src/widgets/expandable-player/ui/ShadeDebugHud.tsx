import { useAtom } from '@reatom/npm-react'
import { type RefObject, useEffect, useState } from 'react'
import {
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewInstance,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  searchCloseMorphDriver,
  searchFocusMorphDriver,
  searchOpenMorphDriver,
} from 'widgets/search-island/@x/morphDrivers'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import {
  isBarCollapsedAtom,
  isTabBarMeasuredAtom,
  keyboardBottomInsetSv,
  tabBarHeightAtom,
} from 'shared/ui/layout'
import { barMorphDriver } from '../model/barMorphDriver'
import { miniPillOpacitySv } from '../model/miniPillFade'

const TICK_MS = 200
const HUD_ENABLED = __DEV__ && process.env.NODE_ENV !== 'test'

const round2 = (value: number) => value.toFixed(2)

const readSearchLine = () =>
  `focus=${round2(searchFocusMorphDriver.progress.value)}` +
  ` open=${round2(searchOpenMorphDriver.progress.value)}` +
  ` close=${round2(searchCloseMorphDriver.progress.value)}`

/**
 * DEV-only overlay with every input of the bottom-shade frame plus the shade
 * box's measured geometry. Exists to read live values off a native cold start,
 * where the shade bottom stops at the islands instead of the screen edge.
 * @param root0 - Component props.
 * @param root0.hasPill - Whether this zone mounts the mini-player pill.
 * @param root0.shadeRef - Ref to the animated shade box being measured.
 */
export const ShadeDebugHud = ({
  hasPill,
  shadeRef,
}: {
  hasPill: boolean
  shadeRef: RefObject<null | ViewInstance>
}) => {
  const [audio] = useAtom(currentAudioAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [barCollapsed] = useAtom(isBarCollapsedAtom)
  const { progress: barProgress, settled: barSettled } = useAtomMorphDriver(barMorphDriver)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const [isTabBarMeasured] = useAtom(isTabBarMeasuredAtom)
  const { bottom } = useSafeAreaInsets()
  const { height: winHeight } = useWindowDimensions()
  const [snapshot, setSnapshot] = useState('measuring…')

  useEffect(() => {
    if (!HUD_ENABLED) return

    const tick = () => {
      shadeRef.current?.measureInWindow((_x: number, y: number, _width: number, height: number) => {
        const boxBottom = y + height

        setSnapshot(
          [
            `audio=${audio ? 1 : 0} pill=${hasPill ? 1 : 0}`,
            `expanded=${expanded ? 1 : 0} barCol=${barCollapsed ? 1 : 0}`,
            `barProg=${round2(barProgress.value)} settled=${barSettled ? 1 : 0}`,
            readSearchLine(),
            `pillOp=${round2(miniPillOpacitySv.value)}`,
            `tbh=${round2(tabBarHeight)} tbm=${isTabBarMeasured ? 1 : 0}`,
            `insetsB=${round2(bottom)} kb=${round2(keyboardBottomInsetSv.value)}` +
              ` winH=${round2(winHeight)}`,
            `boxY=${round2(y)} boxH=${round2(height)}`,
            `boxBottom-Δ=${round2(winHeight - boxBottom)}`,
          ].join('\n'),
        )
      })
    }

    tick()
    const tickId = setInterval(tick, TICK_MS)

    return () => clearInterval(tickId)
  }, [
    audio,
    barCollapsed,
    barProgress,
    barSettled,
    bottom,
    expanded,
    hasPill,
    isTabBarMeasured,
    shadeRef,
    tabBarHeight,
    winHeight,
  ])

  if (!HUD_ENABLED) return null

  return (
    <View style={styles.hud} pointerEvents='none'>
      <Text style={styles.text}>{snapshot}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  hud: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 6,
    position: 'absolute',
    right: 8,
    top: 8,
  },
  text: {
    color: '#fff',
    fontFamily: Platform.select({ android: 'monospace', default: 'monospace', ios: 'Menlo' }),
    fontSize: 9,
  },
})
