import { useState } from 'react'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'
import { BackupSection } from 'features/settings-backup'
import { isWebVibrationSupported } from 'shared/lib/haptics'
import { INDENTS, isMaterialYouSupported, useTheme } from 'shared/ui/theme'
import { DynamicColorsItem } from './DynamicColorsItem'
import { HapticsSettingsItem } from './HapticsSettingsItem'
import { ServerUrlSettings } from './ServerUrlSettings'
import { SettingsItem } from './SettingsItem'
import { ThemeDialog } from './ThemeDialog'

export const SettingsScreen = () => {
  const [showThemeDialog, setShowThemeDialog] = useState(false)
  const { currentTheme } = useTheme()
  const showHapticsItem = Platform.OS !== 'web' || isWebVibrationSupported()

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
        {showHapticsItem && <HapticsSettingsItem />}
        <BackupSection />
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
