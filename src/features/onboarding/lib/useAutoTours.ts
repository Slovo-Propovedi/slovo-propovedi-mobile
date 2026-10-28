import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAction, useAtom } from '@reatom/npm-react'
import { usePathname } from 'expo-router'
import { useEffect, useRef } from 'react'
import { APP_VERSION } from 'shared/config'
import { setToursSeenVersion, TOURS_SEEN_VERSION_KEY, toursDisabledAtom } from 'shared/model'
import { onboardingTourAtom, startOnboardingTour } from '../model/tour'
import { type AutoTourDecision, resolveAutoTour } from './resolveAutoTour'
import { scenariosById } from './scenarios'

const AUTO_TOUR_DELAY_MS = 2500

export const useAutoTours = ({ delayMs = AUTO_TOUR_DELAY_MS }: { delayMs?: number } = {}) => {
  const [toursDisabled] = useAtom(toursDisabledAtom)
  const [activeTour] = useAtom(onboardingTourAtom)
  const setSeenVersion = useAction(setToursSeenVersion)
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
          APP_VERSION,
          scenariosById.whatsNew.steps.length > 0,
        )
        if (decision === null) return

        // Welcome also marks the current «Что нового» as seen: a fresh install
        // must not get the release tour on top of the first-run tour.
        await setSeenVersion(APP_VERSION)
        if (activeTour === null) startTour(decision, pathnameRef.current)
      })()
    }, delayMs)

    return () => clearTimeout(timer)
  }, [activeTour, delayMs, setSeenVersion, startTour, toursDisabled])
}
