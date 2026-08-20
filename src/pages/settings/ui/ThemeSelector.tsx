import { useAction, useAtom } from '@reatom/npm-react'
import { StyleSheet, View } from 'react-native'
import { INDENTS, setThemeMode, themeModeAtom, useTheme } from 'shared/ui/theme'
import { themeOptions } from './themeOptions'
import { ThemeSelectorOption } from './ThemeSelectorOption'

interface ThemeSelectorProps {
  onSelect?: () => void
}

export const ThemeSelector = ({ onSelect }: ThemeSelectorProps) => {
  const [themeMode] = useAtom(themeModeAtom)
  const setThemeModeAction = useAction(setThemeMode)
  const { currentTheme } = useTheme()

  return (
    <View style={styles.container}>
      {themeOptions.map(option => (
        <ThemeSelectorOption
          option={option}
          key={option.value}
          currentTheme={currentTheme}
          isSelected={themeMode === option.value}
          onPress={() => {
            void setThemeModeAction(option.value)
            onSelect?.()
          }}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: INDENTS.low,
  },
})
