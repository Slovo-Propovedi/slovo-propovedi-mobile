import { useState } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { FormField } from 'shared/ui/form'
import { Modal } from 'shared/ui/modal'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { type AdminFileKind } from '../lib/fileKinds'
import { useAdminFiles } from '../lib/useAdminFiles'
import { useFileUpload } from '../lib/useFileUpload'
import { styles } from './styles'

const PICK_LABEL = 'Выбрать из библиотеки'
const LOAD_ERROR = 'Не удалось загрузить файлы'
const EMPTY = 'Файлов нет'

const uploadLabel = (kind: AdminFileKind, hasValue: boolean) => {
  if (kind === 'audio') return hasValue ? 'Заменить аудио' : 'Загрузить аудио'
  if (kind === 'image') return hasValue ? 'Заменить изображение' : 'Загрузить изображение'

  return hasValue ? 'Заменить файл' : 'Загрузить файл'
}

const libraryTitle = (kind: AdminFileKind) => {
  if (kind === 'audio') return 'Библиотека аудио'
  if (kind === 'image') return 'Библиотека изображений'

  return 'Библиотека файлов'
}

const fileLabel = (file: APITypes.FileMetadataDto) => file.fileUrl.split('/').pop() ?? file.fileUrl

// Выбор файла (аудио/текст): ручной URL, системный пикер с загрузкой и
// прогрессом, галерея уже загруженных файлов этого вида.
export const FileUploadField = ({
  hint,
  kind,
  label,
  onChange,
  value,
}: {
  hint?: string
  kind: AdminFileKind
  label: string
  onChange: (value: string) => void
  value: string
}) => {
  const { currentTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const { files, isError, isLoading } = useAdminFiles(kind)
  const { error, isUploading, pickAndUpload, progress } = useFileUpload(kind, onChange)

  const selectFile = (url: string) => {
    onChange(url)
    setIsOpen(false)
  }

  return (
    <View>
      <FormField
        hint={hint}
        value={value}
        label={label}
        placeholder='https://…'
        onChangeText={onChange}
      />
      <TouchableItem
        disabled={isUploading}
        onPress={() => void pickAndUpload()}
        style={[styles.uploadButton, { backgroundColor: currentTheme.primary }]}
      >
        {isUploading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.uploadButtonText}>{uploadLabel(kind, Boolean(value))}</Text>
        )}
      </TouchableItem>
      {isUploading ? (
        <View style={[styles.progressTrack, { backgroundColor: currentTheme.surface }]}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      ) : null}
      {error ? <Text style={[styles.hint, { color: currentTheme.primary }]}>{error}</Text> : null}
      <TouchableItem
        onPress={() => setIsOpen(true)}
        style={[styles.libraryButton, { borderColor: currentTheme.textMuted }]}
      >
        <Text style={[styles.hint, { color: currentTheme.primary }]}>{PICK_LABEL}</Text>
      </TouchableItem>
      <Modal visible={isOpen} onBackdropPress={() => setIsOpen(false)}>
        <View>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
            {libraryTitle(kind)}
          </Text>
          {isLoading ? (
            <View style={styles.state}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : isError ? (
            <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{LOAD_ERROR}</Text>
          ) : files.length === 0 ? (
            <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{EMPTY}</Text>
          ) : (
            <FlatList
              data={files}
              keyExtractor={file => file.fileName}
              contentContainerStyle={styles.gridList}
              renderItem={({ item }) => (
                <TouchableItem
                  onPress={() => selectFile(item.fileUrl)}
                  style={[styles.libraryButton, { borderColor: currentTheme.textMuted }]}
                >
                  <Text numberOfLines={1} style={[styles.hint, { color: currentTheme.text }]}>
                    {fileLabel(item)}
                  </Text>
                </TouchableItem>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  )
}
