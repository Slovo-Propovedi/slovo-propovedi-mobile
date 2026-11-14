import Ionicons from '@expo/vector-icons/Ionicons'
import { type AudioPlayer, type AudioStatus } from 'expo-audio'
import { View } from 'react-native'
import { PlayerProgressBar } from 'entities/player'
import { millisToSeconds } from 'shared/lib/player'
import { reportError } from 'shared/model/error-dialog'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const PLAY_LABEL = 'Воспроизвести'
const PAUSE_LABEL = 'Пауза'
const SEEK_ERROR_MESSAGE = 'Ошибка при перемотке аудио'

// Превью аудио проповеди на expo-audio: play/pause и перематываемая полоса.
// Экземпляр плеера создаётся экраном и передаётся сюда, чтобы состояние
// воспроизведения не терялось при перерисовках карточки.
export const SermonAudioPreview = ({
  player,
  status,
}: {
  player: AudioPlayer
  status: AudioStatus
}) => {
  const { currentTheme } = useTheme()

  const toggle = () => {
    if (status.playing) {
      player.pause()
      return
    }

    player.play()
  }

  const handleSeek = (positionMillis: number) => {
    void player.seekTo(millisToSeconds(positionMillis)).catch(error => {
      console.error('[SermonAudioPreview] seek failed:', error)
      reportError(error, SEEK_ERROR_MESSAGE)
    })
  }

  return (
    <View style={[styles.audioRow, { backgroundColor: currentTheme.background }]}>
      <IconButton
        onPress={toggle}
        accessibilityLabel={status.playing ? PAUSE_LABEL : PLAY_LABEL}
        Icon={
          <Ionicons
            size={26}
            color={currentTheme.primary}
            name={status.playing ? 'pause-circle' : 'play-circle'}
          />
        }
      />
      <PlayerProgressBar
        onSeek={handleSeek}
        style={styles.audioProgress}
        duration={status.duration * 1000}
        position={status.currentTime * 1000}
      />
    </View>
  )
}
