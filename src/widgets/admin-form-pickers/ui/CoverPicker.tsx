import { useState } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'
import { CoverImage } from 'shared/ui'
import { FormField } from 'shared/ui/form'
import { Modal } from 'shared/ui/modal'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { useAdminFiles } from '../lib/useAdminFiles'
import { useFileUpload } from '../lib/useFileUpload'
import { styles } from './styles'

const PICK_LABEL = 'Выбрать из библиотеки'
const UPLOAD_LABEL = 'Загрузить изображение'
const LIBRARY_TITLE = 'Библиотека изображений'
const LOAD_ERROR = 'Не удалось загрузить изображения'
const EMPTY = 'Изображений нет'

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
      <FormField
        value={value}
        label='Обложка (URL)'
        placeholder='https://…'
        onChangeText={onChange}
      />
      <TouchableItem
        onPress={() => setIsOpen(true)}
        style={[styles.libraryButton, { borderColor: currentTheme.textMuted }]}
      >
        <Text style={[styles.hint, { color: currentTheme.primary }]}>{PICK_LABEL}</Text>
      </TouchableItem>
      <TouchableItem
        disabled={isUploading}
        onPress={() => void pickAndUpload()}
        style={[styles.uploadButton, { backgroundColor: currentTheme.primary }]}
      >
        {isUploading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.uploadButtonText}>{UPLOAD_LABEL}</Text>
        )}
      </TouchableItem>
      {isUploading ? (
        <View style={[styles.progressTrack, { backgroundColor: currentTheme.surface }]}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      ) : null}
      {error ? <Text style={[styles.hint, { color: currentTheme.primary }]}>{error}</Text> : null}
      <Modal visible={isOpen} onBackdropPress={() => setIsOpen(false)}>
        <View>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{LIBRARY_TITLE}</Text>
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
              numColumns={3}
              keyExtractor={file => file.fileName}
              contentContainerStyle={styles.gridList}
              renderItem={({ item }) => (
                <TouchableItem style={styles.gridCell} onPress={() => selectFile(item.fileUrl)}>
                  <CoverImage
                    uri={item.fileUrl}
                    style={styles.gridImage}
                    imageStyle={styles.gridImage}
                  />
                </TouchableItem>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  )
}
