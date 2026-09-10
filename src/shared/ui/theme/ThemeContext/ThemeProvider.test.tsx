import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx, type Ctx } from '@reatom/framework'
import { reatomContext } from '@reatom/npm-react'
import { act, render, waitFor } from '@testing-library/react-native'
import { Appearance, Text, useColorScheme } from 'react-native'
import { updateCOLORS } from '../colors'
import { DarkTheme, LightTheme } from '../constants'
import {
  currentThemeAtom,
  dynamicColorsEnabledAtom,
  loadDynamicColors,
  loadThemeMode,
  setThemeMode,
  systemThemeAtom,
  themeModeAtom,
  updateThemeBasedOnMode,
} from '../model'
import { type ThemeMode } from '../types'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './useTheme'

jest.mock('../colors', () => ({
  updateCOLORS: jest.fn(),
}))

// Module duality: the useColorScheme hook reads its own internal
// react-native/Libraries/Utilities/Appearance, while jest.spyOn patches the public
// react-native export — the spy never reaches the hook. Mock the hook itself instead.
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>

const IS_LIGHT_FALSE = 'isLight:false'
const IS_LIGHT_TRUE = 'isLight:true'
const THEME_MODE_DARK = 'themeMode:dark'
const THEME_MODE_LIGHT = 'themeMode:light'

jest.mock('../model', () => {
  const actual = jest.requireActual('../model')
  return {
    ...actual,
    loadDynamicColors: jest.fn(async () => false),
    loadThemeMode: jest.fn(async () => 'system'),
    updateThemeBasedOnMode: jest.fn(async () => {}),
  }
})

const ThemeProbe = () => {
  const { currentTheme, isLight, themeMode } = useTheme()

  return (
    <>
      <Text>{`isLight:${String(isLight)}`}</Text>
      <Text>{`themeMode:${themeMode}`}</Text>
      <Text>{`background:${String(currentTheme.background)}`}</Text>
    </>
  )
}

const renderProbe = async (ctx: Ctx) => {
  const view = await render(
    <reatomContext.Provider value={ctx}>
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    </reatomContext.Provider>,
  )

  await act(async () => {})

  return view
}

const setupAtoms = (
  mode: ThemeMode,
  {
    dynamicEnabled = false,
    system = 'light',
  }: { dynamicEnabled?: boolean; system?: 'dark' | 'light' } = {},
) => {
  jest.mocked(Appearance.getColorScheme).mockReturnValue(system)
  mockedUseColorScheme.mockReturnValue(system)

  const ctx = createCtx()
  const theme =
    mode === 'light' || (mode === 'system' && system === 'light') ? LightTheme : DarkTheme

  themeModeAtom(ctx, mode)
  dynamicColorsEnabledAtom(ctx, dynamicEnabled)
  systemThemeAtom(ctx, system)
  currentThemeAtom(ctx, theme)

  return ctx
}

describe('<ThemeProvider>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(null)
    jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue(undefined)
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light')
    mockedUseColorScheme.mockReturnValue('light')
    jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {})
    jest.spyOn(Appearance, 'addChangeListener').mockReturnValue({ remove: jest.fn() })
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders its children', async () => {
    const ctx = setupAtoms('light')

    const { getByText } = await renderProbe(ctx)

    expect(getByText(THEME_MODE_LIGHT)).toBeTruthy()
  })

  test('provides the current theme, mode and light flag to consumers', async () => {
    const ctx = setupAtoms('light')

    const { getByText } = await renderProbe(ctx)

    expect(getByText(THEME_MODE_LIGHT)).toBeTruthy()
    expect(getByText(IS_LIGHT_TRUE)).toBeTruthy()
    expect(getByText(`background:${String(LightTheme.background)}`)).toBeTruthy()
  })

  test('reports isLight=false for an explicit dark mode even when the system is light', async () => {
    const ctx = setupAtoms('dark', { system: 'light' })

    const { getByText } = await renderProbe(ctx)

    expect(getByText(IS_LIGHT_FALSE)).toBeTruthy()
  })

  test('reports isLight=true for an explicit light mode even when the system is dark', async () => {
    const ctx = setupAtoms('light', { system: 'dark' })

    const { getByText } = await renderProbe(ctx)

    expect(getByText(IS_LIGHT_TRUE)).toBeTruthy()
  })

  test('follows the system scheme while in system mode', async () => {
    const lightCtx = setupAtoms('system', { system: 'light' })
    const { getByText: getLightText } = await renderProbe(lightCtx)
    expect(getLightText(IS_LIGHT_TRUE)).toBeTruthy()

    const darkCtx = setupAtoms('system', { system: 'dark' })
    const { getByText: getDarkText } = await renderProbe(darkCtx)
    expect(getDarkText(IS_LIGHT_FALSE)).toBeTruthy()
  })

  test('lets dynamic colors follow the system scheme regardless of the selected mode', async () => {
    const ctx = setupAtoms('dark', { dynamicEnabled: true, system: 'light' })

    const { getByText } = await renderProbe(ctx)

    expect(getByText(IS_LIGHT_TRUE)).toBeTruthy()
  })

  test('reflects a theme change triggered through setThemeMode', async () => {
    const ctx = setupAtoms('light')

    const { getByText } = await renderProbe(ctx)
    expect(getByText(THEME_MODE_LIGHT)).toBeTruthy()

    await act(async () => {
      await setThemeMode(ctx, 'dark')
    })

    expect(getByText(THEME_MODE_DARK)).toBeTruthy()
    expect(getByText(`background:${String(DarkTheme.background)}`)).toBeTruthy()
  })

  test('applies the active theme to COLORS on mount', async () => {
    const ctx = setupAtoms('light')

    await renderProbe(ctx)

    expect(updateCOLORS).toHaveBeenCalledWith(ctx)
  })

  test('loads the persisted mode and dynamic-colors preference on mount', async () => {
    const ctx = setupAtoms('light')

    await renderProbe(ctx)

    expect(loadThemeMode).toHaveBeenCalled()
    expect(loadDynamicColors).toHaveBeenCalled()
  })

  test('re-runs updateThemeBasedOnMode when the mode changes', async () => {
    const ctx = setupAtoms('light')

    await renderProbe(ctx)
    const callsAfterMount = jest.mocked(updateThemeBasedOnMode).mock.calls.length

    await act(async () => {
      await setThemeMode(ctx, 'dark')
    })

    await waitFor(() =>
      expect(jest.mocked(updateThemeBasedOnMode).mock.calls.length).toBeGreaterThan(
        callsAfterMount,
      ),
    )
  })

  test('forwards system appearance changes to setSystemTheme', async () => {
    const ctx = setupAtoms('light')

    await renderProbe(ctx)

    const listeners = jest
      .mocked(Appearance.addChangeListener)
      .mock.calls.map(([listener]) => listener)

    act(() => {
      listeners.forEach(listener => listener({ colorScheme: 'dark' }))
    })

    expect(ctx.get(systemThemeAtom)).toBe('dark')
  })
})
