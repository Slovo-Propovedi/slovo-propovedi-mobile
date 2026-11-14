import { type AudioPlayer, type AudioStatus } from 'expo-audio'
import { Text, View } from 'react-native'
import { FILE_URL_PATTERN, YOUTUBE_URL_PATTERN } from 'shared/lib/validation/inputLimits'
import { useTheme } from 'shared/ui/theme'
import { MediaLink } from './MediaLink'
import { SermonAudioPreview } from './SermonAudioPreview'
import { styles } from './styles'

const YOUTUBE_LABEL = 'Смотреть на YouTube'
const TEXT_LABEL = 'Открыть текст проповеди'

// Карточка медиа проповеди: аудио-превью, ссылки на YouTube и текст.
// Ничего не рендерится, если медиа нет.
export const SermonMediaCard = ({
  audioUrl,
  player,
  status,
  textFileUrl,
  youtubeUrl,
}: {
  audioUrl: null | string
  player: AudioPlayer
  status: AudioStatus
  textFileUrl: null | string
  youtubeUrl: null | string
}) => {
  const { currentTheme } = useTheme()

  if (!audioUrl && !youtubeUrl && !textFileUrl) return null

  return (
    <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.cardTitle, { color: currentTheme.text }]}>Медиа</Text>
      {audioUrl ? <SermonAudioPreview player={player} status={status} /> : null}
      {youtubeUrl ? (
        <MediaLink url={youtubeUrl} label={YOUTUBE_LABEL} pattern={YOUTUBE_URL_PATTERN} />
      ) : null}
      {textFileUrl ? (
        <MediaLink url={textFileUrl} label={TEXT_LABEL} pattern={FILE_URL_PATTERN} />
      ) : null}
    </View>
  )
}
