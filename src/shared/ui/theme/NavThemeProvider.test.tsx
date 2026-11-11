import { createCtx } from '@reatom/framework'
import { reatomContext } from '@reatom/npm-react'
import { act, render } from '@testing-library/react-native'
import { useTheme as useForkTheme } from 'expo-router/react-navigation'
import { Appearance, Text, useColorScheme } from 'react-native'
import { DarkTheme, LightTheme } from './constants'
import { currentThemeAtom, systemThemeAtom, themeModeAtom } from './model'
import { NavThemeProvider } from './NavThemeProvider'
import { ThemeProvider } from './ThemeContext/ThemeProvider'

jest.mock('./colors', () => ({ updateCOLORS: jest.fn() }))

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('./model', () => {
  const actual = jest.requireActual('./model')

  return {
    ...actual,
    loadDynamicColors: jest.fn(async () => false),
    loadThemeMode: jest.fn(async () => 'system'),
    updateThemeBasedOnMode: jest.fn(async () => {}),
  }
})

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>

const ForkThemeProbe = () => {
  const theme = useForkTheme()

  return <Text>{String(theme.colors.background)}</Text>
}

const renderBridge = async (mode: 'dark' | 'light') => {
  mockedUseColorScheme.mockReturnValue(mode)

  const ctx = createCtx()
  themeModeAtom(ctx, mode)
  systemThemeAtom(ctx, mode)
  currentThemeAtom(ctx, mode === 'light' ? LightTheme : DarkTheme)

  const view = await render(
    <reatomContext.Provider value={ctx}>
      <ThemeProvider>
        <NavThemeProvider>
          <ForkThemeProbe />
        </NavThemeProvider>
      </ThemeProvider>
    </reatomContext.Provider>,
  )

  await act(async () => {})

  return view
}

describe('<NavThemeProvider>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Appearance, 'addChangeListener').mockReturnValue({ remove: jest.fn() })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('feeds the app dark background into the expo-router fork theme context', async () => {
    const { getByText } = await renderBridge('dark')

    expect(getByText(DarkTheme.background)).toBeTruthy()
  })

  test('feeds the app light background into the expo-router fork theme context', async () => {
    const { getByText } = await renderBridge('light')

    expect(getByText(LightTheme.background)).toBeTruthy()
  })
})
