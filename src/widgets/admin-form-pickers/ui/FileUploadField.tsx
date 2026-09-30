import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { EditableUrlField } from 'shared/ui/form'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { type AdminFileKind } from '../lib/fileKinds'
import { useAdminFiles } from '../lib/useAdminFiles'
import { useFileUpload } from '../lib/useFileUpload'
import { FileLibraryModal } from './FileLibraryModal'
import { styles } from './styles'

const PICK_LABEL = 'Выбрать из библиотеки'

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
      <EditableUrlField
        hint={hint}
        value={value}
        label={label}
        placeholder='https://…'
        onChangeText={onChange}
      />
      <View style={styles.actionsRow}>
        <TouchableItem
          onPress={() => setIsOpen(true)}
          style={[styles.libraryButton, { borderColor: currentTheme.textMuted }]}
        >
          <Ionicons size={20} name='albums-outline' color={currentTheme.primary} />
          <Text style={[styles.libraryButtonLabel, { color: currentTheme.primary }]}>
            {PICK_LABEL}
          </Text>
        </TouchableItem>
        <TouchableItem
          disabled={isUploading}
          onPress={() => void pickAndUpload()}
          style={[styles.uploadButton, { backgroundColor: currentTheme.primary }]}
        >
          {isUploading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <View style={styles.uploadButtonContent}>
              <Ionicons size={20} color={COLORS.white} name='cloud-upload-outline' />
              <Text style={styles.uploadButtonText}>{uploadLabel(kind, Boolean(value))}</Text>
            </View>
          )}
        </TouchableItem>
      </View>
      {isUploading ? (
        <View style={[styles.progressTrack, { backgroundColor: currentTheme.surface }]}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      ) : null}
      {error ? <Text style={[styles.hint, { color: currentTheme.primary }]}>{error}</Text> : null}
      <FileLibraryModal
        files={files}
        visible={isOpen}
        isError={isError}
        isLoading={isLoading}
        title={libraryTitle(kind)}
        onClose={() => setIsOpen(false)}
        renderFile={file => (
          <TouchableItem
            onPress={() => selectFile(file.fileUrl)}
            style={[styles.libraryButton, { borderColor: currentTheme.textMuted }]}
          >
            <Text numberOfLines={1} style={[styles.hint, { color: currentTheme.text }]}>
              {fileLabel(file)}
            </Text>
          </TouchableItem>
        )}
      />
    </View>
  )
}
