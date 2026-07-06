import { useAction } from '@reatom/npm-react'
import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ErrorDialog, useErrorDialog } from 'shared/ui/error-dialog'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/themed'
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Настройки</Text>
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
    </SafeAreaView>
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
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h1,
    fontWeight: 'bold',
    marginBottom: INDENTS.high,
    paddingHorizontal: INDENTS.high,
  },
})
