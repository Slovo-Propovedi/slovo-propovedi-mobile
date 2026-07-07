import { ThemeMode } from 'shared/ui/theme'
import type { Ionicons } from '@expo/vector-icons'

export interface ThemeSelectorOption {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: ThemeMode
}

export const themeOptions: ThemeSelectorOption[] = [
  { icon: 'sunny-outline', label: 'Светлая', value: ThemeMode.Light },
  { icon: 'moon-outline', label: 'Тёмная', value: ThemeMode.Dark },
  { icon: 'phone-portrait-outline', label: 'Как в системе', value: ThemeMode.System },
]
