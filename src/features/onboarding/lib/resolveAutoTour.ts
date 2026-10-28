import { compareVersions } from 'shared/lib/version-check'

export type AutoTourDecision = 'welcome' | 'whatsNew' | null

// `seenVersion` — the app version whose «Что нового» content was already shown.
// `hasWhatsNewSteps` — a release without user-visible novelties ships an empty
// scenario, which stays silent instead of starting a tour with no cards.
export const resolveAutoTour = (
  seenVersion: null | string,
  appVersion: string,
  hasWhatsNewSteps: boolean,
): AutoTourDecision => {
  if (seenVersion === null) return 'welcome'

  if (!hasWhatsNewSteps) return null

  return compareVersions(seenVersion, appVersion) < 0 ? 'whatsNew' : null
}
