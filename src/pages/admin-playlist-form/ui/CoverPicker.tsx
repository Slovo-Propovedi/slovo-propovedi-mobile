import { useState } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'
import { CoverImage } from 'shared/ui'
import { FormField } from 'shared/ui/form'
import { Modal } from 'shared/ui/modal'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { useFileImages } from '../lib/useFileImages'
import { styles } from './styles'

const PICK_LABEL = 'Выбрать из библиотеки'
const LIBRARY_TITLE = 'Библиотека изображений'
const LOAD_ERROR = 'Не удалось загрузить изображения'
const EMPTY = 'Изображений нет'

// Выбор обложки: ручной ввод URL + галерея изображений из библиотеки файлов.
// Загрузка файла напрямую отложена до фазы медиа (см. docs/debt.md).
export const CoverPicker = ({
  onChange,
  value,
}: {
  onChange: (value: string) => void
  value: string
}) => {
  const { currentTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const { files, isError, isLoading } = useFileImages()

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
        style={[styles.input, { borderColor: currentTheme.textMuted }]}
      >
        <Text style={[styles.hint, { color: currentTheme.primary }]}>{PICK_LABEL}</Text>
      </TouchableItem>
      <Modal visible={isOpen} onBackdropPress={() => setIsOpen(false)}>
        <View>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{LIBRARY_TITLE}</Text>
          {isLoading ? (
            <View style={styles.centered}>
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
