import { useAction } from '@reatom/npm-react'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ErrorDialog, useErrorDialog } from 'shared/ui/error-dialog'
import { isMaterialYouSupported } from 'shared/ui/theme'
import { INDENTS, useTheme } from 'shared/ui/themed'
import { clearCacheAction } from '../model'
import { ClearCacheDialog } from './ClearCacheDialog'
import { DynamicColorsItem } from './DynamicColorsItem'
import { ServerUrlSettings } from './ServerUrlSettings'
import { SettingsItem } from './SettingsItem'
import { ThemeDialog } from './ThemeDialog'

export const SettingsScreen = () => {
  const [showDialog, setShowDialog] = useState(false)
  const [showThemeDialog, setShowThemeDialog] = useState(false)
  const clearCache = useAction(clearCacheAction)
  const { dismissError, errorDetail, errorMessage, showError } = useErrorDialog()
  const { currentTheme } = useTheme()

  const handleClearCache = () => {
    setShowDialog(false)

    void clearCache()
      .then(result => {
        if (!result?.success && result?.error)
          showError(result.error, 'Не удалось очистить кеш. Попробуйте снова.')
      })
      .catch(error => {
        showError(error, 'Ошибка при очистке кеша')
      })
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsItem
          title='Тема оформления'
          icon='color-palette-outline'
          testID='theme-settings-item'
          description='Светлая, тёмная или как в системе'
          onPress={() => {
            setShowThemeDialog(true)
          }}
        />
        {isMaterialYouSupported() && <DynamicColorsItem testID='dynamic-colors-item' />}
        <SettingsItem
          icon='trash-outline'
          title='Очистить кэш'
          testID='clear-cache-item'
          description='Удалить все скачанные аудио файлы'
          onPress={() => {
            setShowDialog(true)
          }}
        />
        <ServerUrlSettings />
      </ScrollView>
      <ClearCacheDialog
        visible={showDialog}
        onConfirm={handleClearCache}
        onCancel={() => {
          setShowDialog(false)
        }}
      />
      <ThemeDialog
        visible={showThemeDialog}
        onDismiss={() => {
          setShowThemeDialog(false)
        }}
      />
      <ErrorDialog
        detail={errorDetail}
        onDismiss={dismissError}
        message={errorMessage || ''}
        visible={errorMessage !== null}
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
