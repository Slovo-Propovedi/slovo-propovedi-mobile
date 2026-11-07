export type AutoTourDecision = 'welcome' | 'whatsNew' | null

// `seen` — the content fingerprint of the «Что нового» steps already shown.
// `contentFingerprint` — fingerprint of the steps this bundle ships. The app
// version plays no role: a release that only bumps the version keeps the same
// content and therefore stays silent, while changed content shows once.
// `hasWhatsNewSteps` — a release without user-visible novelties ships an empty
// scenario, which stays silent instead of starting a tour with no cards.
export const resolveAutoTour = (
  seen: null | string,
  contentFingerprint: string,
  hasWhatsNewSteps: boolean,
): AutoTourDecision => {
  if (seen === null) return 'welcome'

  if (!hasWhatsNewSteps) return null

  if (seen === contentFingerprint) return null

  return 'whatsNew'
}
