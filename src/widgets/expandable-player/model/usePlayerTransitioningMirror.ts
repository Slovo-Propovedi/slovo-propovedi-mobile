import { useAtom } from '@reatom/npm-react'
import { useAnimatedReaction } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import type { SharedValue } from 'react-native-reanimated'
import { isPlayerTransitioningAtom } from './isPlayerTransitioningAtom'

// Границы «идёт переход»: строго между свёрнутым (0) и развёрнутым (1).
// Мгновенные снапы прогресса 0↔1 (возврат из фона) не считаются переходом.
const TRANSITION_EPSILON = 0.001

/**
 * Зеркалит UI-поток прогресса плеера в JS-состояние: пока прогресс строго между
 * 0 и 1, плеер в движении. Потребители (свечение на экране «Слушать») замирают
 * на время перехода. Снапы 0↔1 условие не ловит — флаг не дёргается.
 * @param progress - Прогресс разворота плеера: 0 — свёрнут, 1 — развёрнут.
 */
export const usePlayerTransitioningMirror = (progress: SharedValue<number>) => {
  const [, setPlayerTransitioning] = useAtom(isPlayerTransitioningAtom)

  useAnimatedReaction(
    () => progress.value > TRANSITION_EPSILON && progress.value < 1 - TRANSITION_EPSILON,
    transitioning => {
      scheduleOnRN(setPlayerTransitioning, transitioning)
    },
    [],
  )
}
