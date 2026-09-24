import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { INDENTS, isMaterialYouSupported, useTheme } from 'shared/ui/theme'
import { DynamicColorsItem } from './DynamicColorsItem'
import { HapticsSettingsItem } from './HapticsSettingsItem'
import { ServerUrlSettings } from './ServerUrlSettings'
import { SettingsItem } from './SettingsItem'
import { ThemeDialog } from './ThemeDialog'

export const SettingsScreen = () => {
  const [showThemeDialog, setShowThemeDialog] = useState(false)
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsItem
          title='Тема оформления'
          icon='color-palette-outline'
          description='Светлая, тёмная или как в системе'
          onPress={() => {
            setShowThemeDialog(true)
          }}
        />
        {isMaterialYouSupported() && <DynamicColorsItem />}
        <HapticsSettingsItem />
        <ServerUrlSettings />
      </ScrollView>
      <ThemeDialog
        visible={showThemeDialog}
        onDismiss={() => {
          setShowThemeDialog(false)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: INDENTS.high,
  },
})
