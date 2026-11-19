import { isGlobalScenario, isScenarioOnScreen } from './scenarioGrouping'
import { scenariosById } from './scenarios'

describe('scenario grouping', () => {
  test('search is local on «Поиск» and global on every other screen', () => {
    expect(isScenarioOnScreen(scenariosById.search, '/search')).toBe(true)
    expect(isGlobalScenario(scenariosById.search, '/search')).toBe(false)

    expect(isScenarioOnScreen(scenariosById.search, '/more')).toBe(false)
    expect(isGlobalScenario(scenariosById.search, '/more')).toBe(true)
  })

  test('a globalFallback scenario is local on its own screens and global elsewhere', () => {
    expect(isScenarioOnScreen(scenariosById.backup, '/settings')).toBe(true)
    expect(isGlobalScenario(scenariosById.backup, '/settings')).toBe(false)

    expect(isScenarioOnScreen(scenariosById.backup, '/listen')).toBe(false)
    expect(isGlobalScenario(scenariosById.backup, '/listen')).toBe(true)
  })

  test('a screen-bound scenario without fallback is hidden on foreign screens', () => {
    expect(isScenarioOnScreen(scenariosById['playlist-add'], '/listen')).toBe(false)
    expect(isGlobalScenario(scenariosById['playlist-add'], '/listen')).toBe(false)
  })

  test('a route-less scenario is global on every screen', () => {
    expect(isGlobalScenario(scenariosById.welcome, '/listen')).toBe(true)
    expect(isGlobalScenario(scenariosById.welcome, '/about')).toBe(true)
  })
})
