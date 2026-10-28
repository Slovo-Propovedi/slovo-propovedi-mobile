import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAction, useAtom } from '@reatom/npm-react'
import { usePathname } from 'expo-router'
import { useEffect, useRef } from 'react'
import { setToursSeenVersion, TOURS_SEEN_VERSION_KEY, toursDisabledAtom } from 'shared/model'
import { onboardingTourAtom, startOnboardingTour } from '../model/tour'
import { contentFingerprint } from './contentFingerprint'
import { type AutoTourDecision, resolveAutoTour } from './resolveAutoTour'
import { scenariosById } from './scenarios'

const AUTO_TOUR_DELAY_MS = 2500

const WHATS_NEW_STEPS = scenariosById.whatsNew.steps
const WHATS_NEW_FINGERPRINT = contentFingerprint(WHATS_NEW_STEPS)

export const useAutoTours = ({ delayMs = AUTO_TOUR_DELAY_MS }: { delayMs?: number } = {}) => {
  const [toursDisabled] = useAtom(toursDisabledAtom)
  const [activeTour] = useAtom(onboardingTourAtom)
  const setSeenFingerprint = useAction(setToursSeenVersion)
  const startTour = useAction(startOnboardingTour)
  const pathname = usePathname()
  const isDecidedRef = useRef(false)
  const pathnameRef = useRef(pathname)

  // Keep the latest pathname without re-arming the start timer on every navigation.
  useEffect(() => {
    pathnameRef.current = pathname
  })

  useEffect(() => {
    if (isDecidedRef.current) return

    const timer = setTimeout(() => {
      isDecidedRef.current = true

      void (async () => {
        if (toursDisabled) return

        const seen = await AsyncStorage.getItem(TOURS_SEEN_VERSION_KEY)
        const decision: AutoTourDecision = resolveAutoTour(
          seen,
          WHATS_NEW_FINGERPRINT,
          WHATS_NEW_STEPS.length > 0,
        )
        if (decision === null) return

        // Welcome also marks the current «Что нового» content as seen: a fresh
        // install must not get the release tour on top of the first-run tour.
        await setSeenFingerprint(WHATS_NEW_FINGERPRINT)
        if (activeTour === null) startTour(decision, pathnameRef.current)
      })()
    }, delayMs)

    return () => clearTimeout(timer)
  }, [activeTour, delayMs, setSeenFingerprint, startTour, toursDisabled])
}
