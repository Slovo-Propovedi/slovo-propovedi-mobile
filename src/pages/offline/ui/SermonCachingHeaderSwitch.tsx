import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import { useEffect, useRef } from 'react'
import { StyleSheet, Switch } from 'react-native'
import { sermonCachingEnabledAtom, setSermonCachingEnabled } from 'entities/offline-cache'
import { PressableButton } from 'shared/ui/pressable-button'
import { COLORS, INDENTS, MIN_TOUCH_TARGET, useTheme } from 'shared/ui/theme'
import { cancelDownloadsAndClearCache } from '../lib/cancelDownloadsAndClearCache'

const CACHING_LABEL = 'Кеширование проповедей'
const SWITCH_SCALE = 0.8

// Turning caching OFF is destructive (cancel downloads + wipe the cache), so
// rapid back-and-forth flipping must not start and stop that clear on every
// press. The switch and the atom flip instantly on every press; only a settled
// OFF value, held for the whole window, runs a single clear.
export const TOGGLE_SETTLE_MS = 800

export const SermonCachingHeaderSwitch = () => {
  const ctx = useCtx()
  const [enabled] = useAtom(sermonCachingEnabledAtom)
  const setEnabled = useAction(setSermonCachingEnabled)
  const { currentTheme } = useTheme()
  const settleTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  // An unmounted screen must not fire a pending clear.
  useEffect(
    () => () => {
      if (settleTimerRef.current !== null) clearTimeout(settleTimerRef.current)
    },
    [],
  )

  const handleToggle = () => {
    if (settleTimerRef.current !== null) clearTimeout(settleTimerRef.current)

    // Target comes from the atom at PRESS time, not from the render closure: the
    // optimistic atom flip is synchronous, so it already holds the freshest
    // value even if a second press lands before the re-render.
    const nextEnabled = !ctx.get(sermonCachingEnabledAtom)

    void setEnabled(nextEnabled).catch(error => {
      console.error('[offline] Failed to apply the sermon caching setting:', error)
    })

    // Turning ON finishes immediately: the timer cleared above also cancels any
    // scheduled OFF run. Turning OFF schedules the single destructive clear for
    // after the user stops toggling.
    if (nextEnabled) return

    settleTimerRef.current = setTimeout(() => {
      settleTimerRef.current = null
      void cancelDownloadsAndClearCache(ctx).catch(error => {
        console.error('[offline] Failed to clear the audio cache:', error)
      })
    }, TOGGLE_SETTLE_MS)
  }

  // The switch is only a picture: RN ignores hitSlop on it (Android applies it
  // to ReactViewGroup only, iOS Fabric toggles via the UISwitch target-action),
  // so a tap on the ~41×25pt scaled control would miss the 44/48pt minimum —
  // unacceptable for an unconfirmed destructive toggle. The wrapper owns the
  // MIN_TOUCH_TARGET tap area, the press and the accessibility contract, and the
  // inner switch is made inert through `pointerEvents: 'none'` in its STYLE — the
  // prop form is not reliably honoured on Fabric — so a tap reaches only the
  // wrapper.
  return (
    <PressableButton
      onPress={handleToggle}
      style={styles.tapTarget}
      accessibilityRole='switch'
      accessibilityLabel={CACHING_LABEL}
      accessibilityState={{ checked: enabled }}
    >
      <Switch
        value={enabled}
        thumbColor={COLORS.white}
        accessibilityElementsHidden
        ios_backgroundColor={COLORS.disabled}
        style={[styles.switch, styles.switchInert]}
        importantForAccessibility='no-hide-descendants'
        trackColor={{ false: COLORS.disabled, true: currentTheme.primary }}
      />
    </PressableButton>
  )
}

const styles = StyleSheet.create({
  switch: {
    marginRight: INDENTS.lowest,
    transform: [{ scaleX: SWITCH_SCALE }, { scaleY: SWITCH_SCALE }],
  },
  switchInert: {
    pointerEvents: 'none',
  },
  tapTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
  },
})
