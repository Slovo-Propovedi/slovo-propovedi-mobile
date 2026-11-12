import { type AudioPlayer } from 'expo-audio'
import { Text, View } from 'react-native'
import { millisToSeconds } from 'shared/lib/player'
import { reportError } from 'shared/model/error-dialog'
import { TimecodedText } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const TIMECODE_SEEK_ERROR_MESSAGE = 'Ошибка при перемотке аудио'

export const SermonDescriptionCard = ({
  audioUrl,
  description,
  player,
}: {
  audioUrl?: null | string
  description: string
  player: AudioPlayer | null
}) => {
  const { currentTheme } = useTheme()

  const handleTimecodePress = (ms: number) => {
    if (!player) return

    void player.seekTo(millisToSeconds(ms)).catch(error => {
      console.error('[SermonDescriptionCard] timecode seek failed:', error)
      reportError(error, TIMECODE_SEEK_ERROR_MESSAGE)
    })
  }

  return (
    <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.cardTitle, { color: currentTheme.text }]}>Описание</Text>
      {audioUrl ? (
        <TimecodedText
          text={description}
          onTimecodePress={handleTimecodePress}
          style={[styles.description, { color: currentTheme.textMuted }]}
          timecodeStyle={[styles.timecode, { color: currentTheme.primary }]}
        />
      ) : (
        <Text style={[styles.description, { color: currentTheme.textMuted }]}>{description}</Text>
      )}
    </View>
  )
}
