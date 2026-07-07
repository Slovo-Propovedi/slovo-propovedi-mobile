import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback } from 'react'
import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native'
import { COLORS, FONT_SIZES } from 'shared/ui/themed'
import { type RepeatMode, repeatModeAtom, setRepeatModeAction } from '../model'

interface PlayerRepeatToggleProps {
  style?: StyleProp<ViewStyle>
}

const REPEAT_MODES: RepeatMode[] = ['off', 'track', 'queue']

interface IconConfig {
  color: string
  name: keyof typeof MaterialCommunityIcons.glyphMap
}

const getRepeatIcon = (mode: RepeatMode): IconConfig => {
  switch (mode) {
    case 'off':
      return { color: '#9ca3af', name: 'repeat-off' }
    case 'queue':
      return { color: COLORS.primary, name: 'repeat' }
    case 'track':
      return { color: COLORS.primary, name: 'repeat-once' }
  }
}

export const PlayerRepeatToggle = ({ style }: PlayerRepeatToggleProps) => {
  const [repeatMode] = useAtom(repeatModeAtom)
  const setRepeatMode = useAction(setRepeatModeAction)

  const handlePress = useCallback(() => {
    const currentIndex = REPEAT_MODES.indexOf(repeatMode)
    const nextIndex = (currentIndex + 1) % REPEAT_MODES.length
    void setRepeatMode(REPEAT_MODES[nextIndex])
  }, [repeatMode, setRepeatMode])

  const iconConfig = getRepeatIcon(repeatMode)

  return (
    <Pressable onPress={handlePress} style={[styles.container, style]}>
      <MaterialCommunityIcons
        size={FONT_SIZES.xxl}
        name={iconConfig.name}
        color={iconConfig.color}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
})
