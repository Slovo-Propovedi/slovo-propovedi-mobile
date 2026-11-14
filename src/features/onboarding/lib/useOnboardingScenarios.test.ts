import { renderHookWithProviders } from 'shared/mocks'
import { useOnboardingScenarios } from './useOnboardingScenarios'

const mockUseFeatureFlag = jest.fn((_key: string) => false)

jest.mock('entities/feature-flags', () => ({
  useFeatureFlag: (key: string) => mockUseFeatureFlag(key),
}))

const scenarioIds = (scenarios: Array<{ id: string }>) => scenarios.map(scenario => scenario.id)

describe('useOnboardingScenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFeatureFlag.mockImplementation(() => false)
  })

  test('keeps the read scenario when its flag is on', async () => {
    mockUseFeatureFlag.mockImplementation(() => true)

    const { result } = await renderHookWithProviders(() => useOnboardingScenarios())

    expect(scenarioIds(result.current)).toContain('read')
  })

  test('drops the read scenario when the read flag is off', async () => {
    const { result } = await renderHookWithProviders(() => useOnboardingScenarios())

    expect(scenarioIds(result.current)).not.toContain('read')
  })

  test('always keeps non-flagged scenarios', async () => {
    const { result } = await renderHookWithProviders(() => useOnboardingScenarios())

    expect(scenarioIds(result.current)).toEqual(
      expect.arrayContaining(['listen', 'playlists', 'history', 'offline', 'settings']),
    )
    expect(scenarioIds(result.current)).not.toContain('read')
  })

  test('keeps auto-only scenarios in the picker, ordered last', async () => {
    const { result } = await renderHookWithProviders(() => useOnboardingScenarios())

    const ids = scenarioIds(result.current)
    expect(ids).toContain('welcome')
    expect(ids).toContain('whatsNew')
    expect(ids.slice(-2)).toEqual(['welcome', 'whatsNew'])
  })

  test('default scope keeps the screen scenarios and drops the player scope', async () => {
    const { result } = await renderHookWithProviders(() => useOnboardingScenarios('default'))

    const ids = scenarioIds(result.current)
    expect(ids).toEqual(expect.arrayContaining(['listen', 'player']))
    expect(ids).not.toContain('player-intro')
    expect(ids).not.toContain('player-speed')
  })

  test('player scope returns only player-scope scenarios', async () => {
    const { result } = await renderHookWithProviders(() => useOnboardingScenarios('player'))

    expect(scenarioIds(result.current)).toEqual([
      'player-intro',
      'player-description',
      'player-speed',
      'player-sound',
      'player-actions',
    ])
  })
})
