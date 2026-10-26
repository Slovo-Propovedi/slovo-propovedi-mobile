import { compareVersions } from 'shared/lib/version-check'

export type AutoTourDecision = 'welcome' | 'whatsNew' | null

// `seenVersion` — the «Что нового» content version already shown (legacy installs
// stored the app version there, which is never older than the content they saw).
export const resolveAutoTour = (
  seenVersion: null | string,
  whatsNewVersion: string,
): AutoTourDecision => {
  if (seenVersion === null) return 'welcome'

  return compareVersions(seenVersion, whatsNewVersion) < 0 ? 'whatsNew' : null
}
