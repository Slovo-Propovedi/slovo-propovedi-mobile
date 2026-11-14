import { useFeatureFlag } from 'entities/feature-flags'
import { resolveScenarioScope, scenarios, type ScenarioScope } from './scenarios'

export const useOnboardingScenarios = (scope: ScenarioScope = 'default') => {
  const hasReadAccess = useFeatureFlag('read')

  return scenarios.filter(scenario => {
    if (resolveScenarioScope(scenario) !== scope) return false
    if (scenario.featureFlag === 'read') return hasReadAccess
    return true
  })
}
