import Ionicons from '@expo/vector-icons/Ionicons'
import { Image } from 'expo-image'
import { Modal, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconButton } from 'shared/ui/icon-button'
import { COLORS, useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const CLOSE_LABEL = 'Закрыть'

// Полноэкранный просмотр изображения из каталога: тап по плитке открывает
// затемнённый вьюер с самой картинкой (`expo-image`, contain). Закрывается по
// кнопке X, по тапу на фон и по системному «назад» Android (onRequestClose).
export const MediaViewerModal = ({
  fileUrl,
  onClose,
  title,
  visible,
}: {
  fileUrl: string
  onClose: () => void
  title: string
  visible: boolean
}) => {
  const { currentTheme } = useTheme()

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType='fade'
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.viewerBackdrop, { backgroundColor: COLORS.black }]}>
        <SafeAreaView edges={['top']} style={styles.viewerHeader}>
          <Text numberOfLines={1} style={styles.viewerTitle}>
            {title}
          </Text>
          <IconButton
            onPress={onClose}
            accessibilityLabel={CLOSE_LABEL}
            Icon={<Ionicons size={26} color={COLORS.white} />}
          />
        </SafeAreaView>
        <Pressable
          onPress={onClose}
          style={styles.viewerBody}
          accessibilityRole='button'
          accessibilityLabel={CLOSE_LABEL}
        >
          <Image
            transition={200}
            contentFit='contain'
            source={{ uri: fileUrl }}
            style={styles.viewerImage}
          />
        </Pressable>
        <Text style={[styles.viewerHint, { color: currentTheme.textMuted }]}>
          Тап по изображению закрывает просмотр
        </Text>
      </View>
    </Modal>
  )
}
