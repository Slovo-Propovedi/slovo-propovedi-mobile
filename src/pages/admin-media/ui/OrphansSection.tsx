import { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { useOrphanedFiles } from '../lib/useOrphanedFiles'
import { OrphansBody } from './OrphansBody'
import { styles } from './styles'

const SCAN_LABEL = 'Найти осиротевшие файлы'
const CONFIRM_TEXT = 'Удалить'
const BUSY_TEXT = 'Удаление…'
const SECTION_HINT =
  'Файлы в хранилище, не привязанные ни к одной проповеди или обложке. Очистка удаляет только аудио и тексты — изображения убирайте вручную из каталога выше.'

const cleanupLabel = (count: number) => `Удалить (${count})`

// Блок «Осиротевшие файлы»: опциональный скан bucket, список найденного и
// best-effort очистка аудио/текста под подтверждением.
export const OrphansSection = () => {
  const { currentTheme } = useTheme()
  const state = useOrphanedFiles()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleCleanup = async () => {
    setIsConfirmOpen(false)
    await state.cleanup()
  }

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Осиротевшие файлы</Text>
      <Text style={[styles.error, { color: currentTheme.textMuted }]}>{SECTION_HINT}</Text>
      <View style={styles.controls}>
        <TouchableItem
          disabled={state.isScanning}
          onPress={() => void state.scan()}
          style={[styles.secondaryButton, { borderColor: currentTheme.textMuted }]}
        >
          {state.isScanning ? (
            <ActivityIndicator color={currentTheme.primary} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: currentTheme.primary }]}>
              {SCAN_LABEL}
            </Text>
          )}
        </TouchableItem>
        {state.orphanCount > 0 ? (
          <TouchableItem
            onPress={() => setIsConfirmOpen(true)}
            style={[styles.primaryButton, { backgroundColor: currentTheme.primary }]}
          >
            <Text style={styles.primaryButtonText}>{cleanupLabel(state.orphanCount)}</Text>
          </TouchableItem>
        ) : null}
      </View>

      <OrphansBody
        isError={state.isError}
        orphaned={state.orphaned}
        hasScanned={state.hasScanned}
        isScanning={state.isScanning}
        cleanupResult={state.cleanupResult}
      />

      <ConfirmDialog
        visible={isConfirmOpen}
        title='Удалить осиротевшие файлы?'
        onConfirm={() => void handleCleanup()}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText={state.isCleaning ? BUSY_TEXT : CONFIRM_TEXT}
        message={`Будет удалено ${state.orphanCount} осиротевших аудио- и текстовых файлов. Изображения не удаляются этой операцией.`}
      />
    </View>
  )
}
