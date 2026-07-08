import { useContext } from 'react'
import { type ThemeContextValue } from './ThemeContext'
import { ThemeContext } from './themeContext'

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')

  return context
}
