import { createContext } from 'react'
import { type ThemeContextValue } from './ThemeContextValue'

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
