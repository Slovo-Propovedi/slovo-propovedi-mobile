import { useAction } from '@reatom/npm-react'
import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/themed'
import { clearCacheAction } from '../model'
import { ClearCacheDialog } from './ClearCacheDialog'
import { SettingsItem } from './SettingsItem'

export const SettingsScreen = () => {
  const [showDialog, setShowDialog] = useState(false)
  const clearCache = useAction(clearCacheAction)

  const handleClearCache = () => {
    // Закрываем диалог СРАЗУ — Early Exit, не ждем результата
    setShowDialog(false)

    // Запускаем очистку в фоне без await
    void clearCache()
      .then(result => {
        if (!result?.success) console.error('❌ Ошибка при очистке:', result?.error)
      })
      .catch(error => {
        console.error('❌ Неожиданная ошибка:', error)
      })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Настройки</Text>
        <SettingsItem
          title='Очистить кэш'
          icon='trash-outline'
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
