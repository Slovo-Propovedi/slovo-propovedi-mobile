import { memo } from 'react'
import { type StyleProp, type TextStyle } from 'react-native'
import { type MarqueeCycle } from './marquee-text/marquee-cycle'
import { MarqueeText } from './marquee-text/marquee-text'
import { useTheme } from './theme/ThemeContext/useTheme'

const MovingTextComponent = ({
  autoStart,
  centerWhenStatic,
  fadeEdge,
  followCycle,
  publishCycle,
  style,
  testID,
  text,
}: {
  autoStart?: boolean
  centerWhenStatic?: boolean
  fadeEdge?: boolean
  followCycle?: MarqueeCycle
  publishCycle?: MarqueeCycle
  style?: StyleProp<TextStyle>
  testID?: string
  text: string
}) => {
  const { currentTheme } = useTheme()

  return (
    <MarqueeText
      text={text}
      testID={testID}
      fadeEdge={fadeEdge}
      autoStart={autoStart}
      followCycle={followCycle}
      publishCycle={publishCycle}
      centerWhenStatic={centerWhenStatic}
      textStyle={[{ color: currentTheme.text }, style]}
    />
  )
}

// Player call sites pass stable StyleSheet styles; memo keeps audio-position
// ticks (~2/s) from re-running MarqueeText when the title/style are unchanged.
export const MovingText = memo(MovingTextComponent)
MovingText.displayName = 'MovingText'
