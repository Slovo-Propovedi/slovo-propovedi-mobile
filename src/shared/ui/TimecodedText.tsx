import { type StyleProp, Text, type TextStyle } from 'react-native'
import { parseTimecodeSegments } from '../lib/player/parseTimecode'

export const TimecodedText = ({
  onTimecodePress,
  style,
  text,
  timecodeStyle,
}: {
  onTimecodePress: (ms: number) => void
  style?: StyleProp<TextStyle>
  text: string
  timecodeStyle?: StyleProp<TextStyle>
}) => {
  const segments = parseTimecodeSegments(text)

  return (
    <Text style={style}>
      {segments.map((segment, index) =>
        segment.type === 'timecode' ? (
          <Text
            style={timecodeStyle}
            accessibilityRole='link'
            key={`timecode-${index}`}
            onPress={() => onTimecodePress(segment.ms)}
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
