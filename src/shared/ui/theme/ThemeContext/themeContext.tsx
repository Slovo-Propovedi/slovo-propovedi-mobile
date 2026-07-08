import { createContext } from 'react'
import { type ThemeContextValue } from './ThemeContext'

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
