import Ionicons from '@expo/vector-icons/Ionicons'
import { type ReactElement, useEffect } from 'react'
import { ActivityIndicator, BackHandler, FlatList, Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { IconButton } from 'shared/ui/icon-button'
import { Modal } from 'shared/ui/modal'
import { COLORS, useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const LOAD_ERROR = 'Не удалось загрузить файлы'
const EMPTY = 'Файлов нет'
const CLOSE_LABEL = 'Закрыть'

// Модалка выбора файла из библиотеки: заголовок с кнопкой закрытия, состояние
// загрузки/ошибки/пустоты и список файлов. Закрывается по тапу на фон, по кнопке
// X и по системному «назад» на Android.
export const FileLibraryModal = ({
  files,
  isError,
  isLoading,
  numColumns = 1,
  onClose,
  renderFile,
  title,
  visible,
}: {
  files: APITypes.FileMetadataDto[]
  isError: boolean
  isLoading: boolean
  numColumns?: number
  onClose: () => void
  renderFile: (file: APITypes.FileMetadataDto) => ReactElement
  title: string
  visible: boolean
}) => {
  const { currentTheme } = useTheme()

  // Android hardware back должен закрывать модалку, а не уводить со всего экрана.
  useEffect(() => {
    if (!visible) return undefined

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose()
      return true
    })

    return () => subscription.remove()
  }, [onClose, visible])

  return (
    <Modal visible={visible} onBackdropPress={onClose}>
      <View style={styles.libraryHeader}>
        <Text numberOfLines={1} style={[styles.modalTitle, { color: currentTheme.text }]}>
          {title}
        </Text>
        <IconButton
          onPress={onClose}
          accessibilityLabel={CLOSE_LABEL}
          Icon={<Ionicons size={24} name='close' color={currentTheme.text} />}
        />
      </View>
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
          numColumns={numColumns}
          keyExtractor={file => file.fileName}
          contentContainerStyle={styles.libraryList}
          renderItem={({ item }) => renderFile(item)}
          columnWrapperStyle={numColumns > 1 ? styles.libraryRow : undefined}
        />
      )}
    </Modal>
  )
}
