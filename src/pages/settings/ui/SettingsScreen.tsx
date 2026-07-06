import { useAction } from '@reatom/npm-react'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ErrorDialog, useErrorDialog } from 'shared/ui/error-dialog'
import { COLORS, INDENTS } from 'shared/ui/themed'
import { clearCacheAction } from '../model'
import { ClearCacheDialog } from './ClearCacheDialog'
import { SettingsItem } from './SettingsItem'

export const SettingsScreen = () => {
  const [showDialog, setShowDialog] = useState(false)
  const clearCache = useAction(clearCacheAction)
  const { dismissError, errorDetail, errorMessage, showError } = useErrorDialog()

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
    <View style={styles.container}>
      <View style={styles.content}>
        <SettingsItem
          icon='trash-outline'
          title='Очистить кэш'
          testID='clear-cache-item'
          description='Удалить все скачанные аудио файлы'
          onPress={() => {
            setShowDialog(true)
          }}
        />
      </View>
      <ClearCacheDialog
        visible={showDialog}
        onConfirm={handleClearCache}
        onCancel={() => {
          setShowDialog(false)
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
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: INDENTS.high,
  },
})
