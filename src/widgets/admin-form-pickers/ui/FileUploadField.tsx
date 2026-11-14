import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { type AdminFileKind } from 'shared/lib/file-drop'
import { EditableUrlField } from 'shared/ui/form'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { getFileKindConfig, getFileKindLibraryIcon } from '../lib/fileKinds'
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

// Выбор файла (аудио/текст): ручной URL и системный пикер с загрузкой и
// прогрессом. Галерея библиотеки доступна только для изображений — `GET /files`
// отдаёт лишь изображения, поэтому для аудио/текста кнопка не показывается.
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
  const { supportsLibrary } = getFileKindConfig(kind)

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
        actions={
          <View style={styles.fieldActions}>
            {supportsLibrary ? (
              <IconButton
                accessibilityLabel={PICK_LABEL}
                onPress={() => setIsOpen(true)}
                Icon={
                  <Ionicons
                    size={20}
                    color={currentTheme.primary}
                    name={getFileKindLibraryIcon(kind)}
                  />
                }
              />
            ) : null}
            <IconButton
              disabled={isUploading}
              onPress={() => void pickAndUpload()}
              accessibilityState={{ disabled: isUploading }}
              accessibilityLabel={uploadLabel(kind, Boolean(value))}
              Icon={
                isUploading ? (
                  <ActivityIndicator color={currentTheme.primary} />
                ) : (
                  <Ionicons size={20} name='cloud-upload-outline' color={currentTheme.primary} />
                )
              }
            />
          </View>
        }
      />
      {isUploading ? (
        <View style={[styles.progressTrack, { backgroundColor: currentTheme.surface }]}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      ) : null}
      {error ? <Text style={[styles.hint, { color: currentTheme.primary }]}>{error}</Text> : null}
      {supportsLibrary ? (
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
              style={[styles.libraryItem, { borderColor: currentTheme.textMuted }]}
            >
              <Text numberOfLines={1} style={[styles.hint, { color: currentTheme.text }]}>
                {fileLabel(file)}
              </Text>
            </TouchableItem>
          )}
        />
      ) : null}
    </View>
  )
}
