import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { CoverImage } from 'shared/ui'
import { EditableUrlField } from 'shared/ui/form'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { useAdminFiles } from '../lib/useAdminFiles'
import { useFileUpload } from '../lib/useFileUpload'
import { FileLibraryModal } from './FileLibraryModal'
import { styles } from './styles'

const PICK_LABEL = 'Выбрать из библиотеки'
const UPLOAD_LABEL = 'Загрузить изображение'
const LIBRARY_TITLE = 'Библиотека изображений'

// Выбор обложки: ручной ввод URL, галерея изображений из библиотеки файлов и
// загрузка нового изображения (multipart с прогрессом).
export const CoverPicker = ({
  onChange,
  value,
}: {
  onChange: (value: string) => void
  value: string
}) => {
  const { currentTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const { files, isError, isLoading } = useAdminFiles('image')
  const { error, isUploading, pickAndUpload, progress } = useFileUpload('image', onChange)

  const selectFile = (url: string) => {
    onChange(url)
    setIsOpen(false)
  }

  return (
    <View>
      {value ? (
        <CoverImage
          eager
          uri={value}
          style={styles.coverPreview}
          imageStyle={styles.coverPreview}
        />
      ) : null}
      <EditableUrlField
        value={value}
        label='Обложка (URL)'
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
              <Text style={styles.uploadButtonText}>{UPLOAD_LABEL}</Text>
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
        numColumns={3}
        visible={isOpen}
        isError={isError}
        isLoading={isLoading}
        title={LIBRARY_TITLE}
        onClose={() => setIsOpen(false)}
        renderFile={file => (
          <TouchableItem style={styles.gridCell} onPress={() => selectFile(file.fileUrl)}>
            <CoverImage uri={file.fileUrl} style={styles.gridImage} imageStyle={styles.gridImage} />
          </TouchableItem>
        )}
      />
    </View>
  )
}
