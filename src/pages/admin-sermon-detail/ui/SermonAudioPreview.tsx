import Ionicons from '@expo/vector-icons/Ionicons'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { Text, View } from 'react-native'
import { millisToMinutesAndSeconds } from 'shared/lib/player'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const PLAY_LABEL = 'Воспроизвести'
const PAUSE_LABEL = 'Пауза'
// Точность полосы прогресса: 0–100.
const PROGRESS_MAX = 100

// Простое превью аудио проповеди на expo-audio: play/pause и позиция.
// Полноценный плеер приложения не переиспользуется — он управляется глобальным
// singleton-состоянием, а здесь нужен лишь локальный предпросмотр без влияния
// на очередь воспроизведения.
export const SermonAudioPreview = ({ url }: { url: string }) => {
  const { currentTheme } = useTheme()
  const player = useAudioPlayer(url)
  const status = useAudioPlayerStatus(player)
  const durationMillis = status.duration * 1000
  const elapsedMillis = status.currentTime * 1000
  const progress = durationMillis > 0 ? (elapsedMillis / durationMillis) * PROGRESS_MAX : 0

  const toggle = () => {
    if (status.playing) {
      player.pause()
      return
    }

    player.play()
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
      <View style={styles.audioProgress}>
        <View style={[styles.audioTrack, { backgroundColor: currentTheme.surface }]}>
          <View
            style={[
              styles.audioFill,
              { backgroundColor: currentTheme.primary, width: `${progress}%` },
            ]}
          />
        </View>
        <Text style={[styles.audioTime, { color: currentTheme.textMuted }]}>
          {`${millisToMinutesAndSeconds(elapsedMillis)} / ${millisToMinutesAndSeconds(durationMillis)}`}
        </Text>
      </View>
    </View>
  )
}
