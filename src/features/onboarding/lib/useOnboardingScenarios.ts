import { useFeatureFlag } from 'entities/feature-flags'
import { useIsWideLayout } from 'shared/ui/layout'
import { resolveScenarioScope, scenarios, type ScenarioScope } from './scenarios'

export const useOnboardingScenarios = (scope: ScenarioScope = 'default') => {
  const hasReadAccess = useFeatureFlag('read')
  const isWideLayout = useIsWideLayout()

  return scenarios.filter(scenario => {
    // «Что нового» presents the wide-layout rebuild, so it is not offered manually
    // in the compact layout either.
    if (scenario.id === 'whatsNew' && !isWideLayout) return false
    if (resolveScenarioScope(scenario) !== scope) return false
    if (scenario.featureFlag === 'read') return hasReadAccess
    return true
  })
}
