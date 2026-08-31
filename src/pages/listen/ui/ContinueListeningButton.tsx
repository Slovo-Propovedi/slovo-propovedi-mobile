import { useAtom } from '@reatom/npm-react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useEntryPlayback } from 'features/entry-playback'
import { useLastListeningEntry } from 'entities/listening-history'
import { currentAudioAtom, isPlayingAtom, usePlayer } from 'entities/player'
import { reportError } from 'shared/model/error-dialog'
import { ContinueCircleButton } from './ContinueCircleButton'

export const NOW_PLAYING_LABEL = 'Воспроизводится'

const START_LISTENING_LABEL = 'Начать слушать'
const CONTINUE_LABEL = 'Продолжить'
const CONTINUE_ERROR_MESSAGE = 'Не удалось продолжить прослушивание'
const PAUSE_ERROR_MESSAGE = 'Не удалось поставить на паузу'
const PAUSE_HINT = 'Приостановить воспроизведение'

export const ContinueListeningButton = () => {
  const { entry, isLoaded, sermon } = useLastListeningEntry()
  const playEntry = useEntryPlayback(CONTINUE_ERROR_MESSAGE)
  const { pause } = usePlayer()
  const [isPlaying] = useAtom(isPlayingAtom)
  const [currentAudio] = useAtom(currentAudioAtom)

  if (!isLoaded) return null

  const isDisabled = !isPlaying && sermon === null

  const handlePress = async () => {
    if (isPlaying) {
      try {
        await pause()
      } catch (error) {
        if (error instanceof Error && error.message.includes('activity is no longer available'))
          console.warn('[ContinueListeningButton] Ignoring AppState-related error:', error.message)
        else reportError(error, PAUSE_ERROR_MESSAGE)
      }
      return
    }

    if (!entry || !sermon) return

    await playEntry(entry)
  }

  const accessibilityLabel = isPlaying
    ? currentAudio
      ? `${NOW_PLAYING_LABEL}: ${currentAudio.title}`
      : NOW_PLAYING_LABEL
    : sermon
      ? `${CONTINUE_LABEL}: ${sermon.title}`
      : START_LISTENING_LABEL

  return (
    <Pressable
      accessible
      disabled={isDisabled}
      accessibilityRole='button'
      onPress={() => void handlePress()}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      accessibilityHint={isPlaying ? PAUSE_HINT : undefined}
      style={({ pressed }) => [styles.block, { opacity: pressed ? 0.8 : isDisabled ? 0.5 : 1 }]}
    >
      <View style={styles.mainArea}>
        <ContinueCircleButton isPlaying={isPlaying} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  block: {
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    // Ровно половина ширины строки — как и секция справа в FirstSectionRow, без
    // внешних полей. Мягкое свечение большой кнопки выходит за границы бокса, но
    // непрозрачный круг остаётся внутри, а секция не вылезает за экран.
    width: '50%',
  },
  mainArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
})
