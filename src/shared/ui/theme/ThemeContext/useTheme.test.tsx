import { renderHook } from '@testing-library/react-native'
import { DarkTheme } from '../constants'
import { type ThemeContextValue } from './ThemeContext'
import { ThemeContext } from './themeContext'
import { useTheme } from './useTheme'

const CONTEXT_VALUE: ThemeContextValue = {
  currentTheme: DarkTheme,
  isLight: false,
  themeMode: 'dark',
}

const renderUseTheme = () =>
  renderHook(() => useTheme(), {
    wrapper: ({ children }) => (
      <ThemeContext.Provider value={CONTEXT_VALUE}>{children}</ThemeContext.Provider>
    ),
  })

describe('useTheme', () => {
  test('returns the value provided by ThemeContext', async () => {
    const { result } = await renderUseTheme()

    expect(result.current).toBe(CONTEXT_VALUE)
  })

  test('exposes the current theme colors', async () => {
    const { result } = await renderUseTheme()

    expect(result.current.currentTheme).toBe(DarkTheme)
    expect(result.current.currentTheme.background).toBe(DarkTheme.background)
  })

  test('throws a descriptive error when used outside ThemeProvider', async () => {
    await expect(renderHook(() => useTheme())).rejects.toThrow(
      'useTheme must be used within ThemeProvider',
    )
  })
})
