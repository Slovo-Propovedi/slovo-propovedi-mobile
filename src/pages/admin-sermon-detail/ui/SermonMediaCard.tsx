import Ionicons from '@expo/vector-icons/Ionicons'
import { useAction } from '@reatom/npm-react'
import { Linking, Text, View } from 'react-native'
import { hasUriProtocol } from 'shared/lib/app-icon'
import { showToast } from 'shared/model'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { SermonAudioPreview } from './SermonAudioPreview'
import { styles } from './styles'

const YOUTUBE_LABEL = 'Смотреть на YouTube'
const TEXT_LABEL = 'Открыть текст проповеди'
const INVALID_URL_MESSAGE = 'Ссылка недоступна'
const OPEN_ERROR_MESSAGE = 'Не удалось открыть ссылку'

// Открывает внешнюю ссылку. URL с сервера — недоверенный ввод, поэтому сперва
// проверяем протокол (иначе native Linking упадёт), затем ловим отказ открытия.
// Возвращает сообщение об ошибке или null при успехе.
const openExternalLink = async (url: string): Promise<null | string> => {
  if (!hasUriProtocol(url)) return INVALID_URL_MESSAGE

  try {
    await Linking.openURL(url)
    return null
  } catch {
    return OPEN_ERROR_MESSAGE
  }
}

// Внешняя ссылка-кнопка медиа: иконка и подпись.
const MediaLink = ({ label, url }: { label: string; url: string }) => {
  const { currentTheme } = useTheme()
  const showToastAction = useAction(showToast)

  const handlePress = async () => {
    const error = await openExternalLink(url)
    if (error) showToastAction(error)
  }

  return (
    <TouchableItem
      onPress={() => void handlePress()}
      style={[styles.mediaLink, { backgroundColor: currentTheme.background }]}
    >
      <Ionicons size={18} name='open-outline' color={currentTheme.primary} />
      <Text numberOfLines={1} style={[styles.mediaLinkText, { color: currentTheme.primary }]}>
        {label}
      </Text>
    </TouchableItem>
  )
}

// Карточка медиа проповеди: аудио-превью, ссылки на YouTube и текст.
// Ничего не рендерится, если медиа нет.
export const SermonMediaCard = ({
  audioUrl,
  textFileUrl,
  youtubeUrl,
}: {
  audioUrl: null | string
  textFileUrl: null | string
  youtubeUrl: null | string
}) => {
  const { currentTheme } = useTheme()

  if (!audioUrl && !youtubeUrl && !textFileUrl) return null

  return (
    <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.cardTitle, { color: currentTheme.text }]}>Медиа</Text>
      {audioUrl ? <SermonAudioPreview url={audioUrl} /> : null}
      {youtubeUrl ? <MediaLink url={youtubeUrl} label={YOUTUBE_LABEL} /> : null}
      {textFileUrl ? <MediaLink url={textFileUrl} label={TEXT_LABEL} /> : null}
    </View>
  )
}
