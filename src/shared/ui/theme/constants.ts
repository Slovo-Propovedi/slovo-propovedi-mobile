import type { ThemeColors } from './types'

export const LightTheme = {
  backdrop: 'rgba(0, 0, 0, 0.5)',
  background: '#fff',
  card: '#f5f5f5',
  icon: '#000',
  skeleton: '#e0e0e0',
  surface: '#e8e8e8',
  text: '#000',
  textMuted: '#666',
} as const satisfies ThemeColors

export const DarkTheme = {
  backdrop: 'rgba(0, 0, 0, 0.8)',
  background: '#000',
  card: '#151515',
  icon: '#fff',
  skeleton: '#333333',
  surface: '#252525',
  text: '#fff',
  textMuted: '#9ca3af',
} as const satisfies ThemeColors

export const getTheme = (mode: string, systemTheme: 'dark' | 'light'): ThemeColors => {
  if (mode === 'system') return systemTheme === 'light' ? LightTheme : DarkTheme

  return mode === 'light' ? LightTheme : DarkTheme
}
