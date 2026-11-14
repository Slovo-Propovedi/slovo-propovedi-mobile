import { StyleSheet } from 'react-native'
import { usePlayer } from 'entities/player'
import { reportError } from 'shared/model/error-dialog'
import { TimecodedText } from 'shared/ui'
import { COLORS, FONT_SIZES } from 'shared/ui/theme'

const TIMECODE_SEEK_ERROR_MESSAGE = 'Ошибка при перемотке аудио'

const localStyles = StyleSheet.create({
  description: {
    color: '#fff',
    fontSize: FONT_SIZES.lg,
    lineHeight: FONT_SIZES.lg * 1.5,
  },

  timecode: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
})

export const DescriptionWithTimecodes = ({ description }: { description: string }) => {
  const { seekTo } = usePlayer()

  const handleTimecodePress = (ms: number) => {
    void seekTo(ms).catch(error => {
      console.error('[DescriptionWithTimecodes] timecode seek failed:', error)
      reportError(error, TIMECODE_SEEK_ERROR_MESSAGE)
    })
  }

  return (
    <TimecodedText
      text={description}
      style={localStyles.description}
      timecodeStyle={localStyles.timecode}
      onTimecodePress={handleTimecodePress}
    />
  )
}
