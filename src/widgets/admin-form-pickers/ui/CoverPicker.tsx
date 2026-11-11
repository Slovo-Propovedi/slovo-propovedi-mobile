import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { CoverImage } from 'shared/ui'
import { EditableUrlField } from 'shared/ui/form'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { getFileKindLibraryIcon } from '../lib/fileKinds'
import { useAdminFiles } from '../lib/useAdminFiles'
import { useFileUpload } from '../lib/useFileUpload'
import { FileLibraryModal } from './FileLibraryModal'
import { styles } from './styles'

const PICK_LABEL = 'Выбрать из библиотеки'
const UPLOAD_LABEL = 'Загрузить изображение'
const LIBRARY_TITLE = 'Библиотека изображений'
const KIND = 'image'

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
  const { files, isError, isLoading } = useAdminFiles(KIND)
  const { error, isUploading, pickAndUpload, progress } = useFileUpload(KIND, onChange)

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
        actions={
          <View style={styles.fieldActions}>
            <IconButton
              accessibilityLabel={PICK_LABEL}
              onPress={() => setIsOpen(true)}
              Icon={
                <Ionicons
                  size={20}
                  color={currentTheme.primary}
                  name={getFileKindLibraryIcon(KIND)}
                />
              }
            />
            <IconButton
              disabled={isUploading}
              accessibilityLabel={UPLOAD_LABEL}
              onPress={() => void pickAndUpload()}
              accessibilityState={{ disabled: isUploading }}
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
