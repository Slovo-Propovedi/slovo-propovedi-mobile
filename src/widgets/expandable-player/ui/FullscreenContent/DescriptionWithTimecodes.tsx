import { StyleSheet, Text } from 'react-native'
import { usePlayer } from 'entities/player'
import { parseTimecodeSegments } from 'shared/lib/player'
import { reportError } from 'shared/model/error-dialog'
import { COLORS, FONT_SIZES } from 'shared/ui/theme'

interface DescriptionWithTimecodesProps {
  description: string
}

const TIMECODE_SEEK_ERROR_MESSAGE = 'Ошибка при перемотке аудио'

const localStyles = StyleSheet.create({
  descriptionText: {
    color: '#fff',
    fontSize: FONT_SIZES.lg,
    lineHeight: FONT_SIZES.lg * 1.5,
  },

  timecode: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
})

export const DescriptionWithTimecodes = ({ description }: DescriptionWithTimecodesProps) => {
  const { seekTo } = usePlayer()
  const segments = parseTimecodeSegments(description)

  const handleTimecodePress = (ms: number) => {
    void seekTo(ms).catch(error => {
      console.error('[DescriptionWithTimecodes] timecode seek failed:', error)
      reportError(error, TIMECODE_SEEK_ERROR_MESSAGE)
    })
  }

  return (
    <Text style={localStyles.descriptionText}>
      {segments.map((segment, index) =>
        segment.type === 'timecode' ? (
          <Text
            accessibilityRole='link'
            key={`timecode-${index}`}
            style={localStyles.timecode}
            onPress={() => handleTimecodePress(segment.ms)}
            accessibilityLabel={`Перейти к ${segment.value}`}
          >
            {segment.value}
          </Text>
        ) : (
          <Text key={`text-${index}`}>{segment.value}</Text>
        ),
      )}
    </Text>
  )
}
