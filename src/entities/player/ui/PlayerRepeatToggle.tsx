import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback } from 'react'
import { type PressableProps, type StyleProp, StyleSheet, type ViewStyle } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { FONT_SIZES, useTheme } from 'shared/ui/theme'
import { applyRepeatMode } from '../lib/applyRepeatMode'
import { type RepeatMode, repeatModeAtom, setRepeatModeAction } from '../model'

const REPEAT_MODES: RepeatMode[] = ['off', 'track', 'queue']
const REPEAT_INACTIVE_COLOR = '#9ca3af'

interface IconConfig {
  color: string
  name: keyof typeof MaterialCommunityIcons.glyphMap
}

const getRepeatIcon = (
  mode: RepeatMode,
  primaryColor: string,
  inactiveColor: string,
): IconConfig => {
  switch (mode) {
    case 'off':
      return { color: inactiveColor, name: 'repeat-off' }
    case 'queue':
      return { color: primaryColor, name: 'repeat' }
    case 'track':
      return { color: primaryColor, name: 'repeat-once' }
  }
}

const getRepeatLabel = (mode: RepeatMode): string => {
  switch (mode) {
    case 'off':
      return 'Повтор: выключен'
    case 'queue':
      return 'Повтор очереди'
    case 'track':
      return 'Повтор трека'
  }
}

export const PlayerRepeatToggle = ({
  hitSlop,
  inactiveColor = REPEAT_INACTIVE_COLOR,
  size = FONT_SIZES.xxl,
  style,
}: {
  /** Touch padding that keeps the ≥48dp target on a smaller visual box. */
  hitSlop?: PressableProps['hitSlop']
  /** Tint of the "off" glyph; active modes keep the theme accent. */
  inactiveColor?: string
  /** Glyph size; defaults to the fullscreen size. */
  size?: number
  style?: StyleProp<ViewStyle>
}) => {
  const { currentTheme } = useTheme()
  const [repeatMode] = useAtom(repeatModeAtom)
  const setRepeatMode = useAction(setRepeatModeAction)

  const handlePress = useCallback(() => {
    const currentIndex = REPEAT_MODES.indexOf(repeatMode)
    const nextIndex = (currentIndex + 1) % REPEAT_MODES.length
    const nextMode = REPEAT_MODES[nextIndex]
    void setRepeatMode(nextMode)
    applyRepeatMode(nextMode)
  }, [repeatMode, setRepeatMode])

  const iconConfig = getRepeatIcon(repeatMode, currentTheme.primary, inactiveColor)

  return (
    <IconButton
      hitSlop={hitSlop}
      onPress={handlePress}
      style={[styles.container, style]}
      accessibilityLabel={getRepeatLabel(repeatMode)}
      Icon={<MaterialCommunityIcons size={size} name={iconConfig.name} color={iconConfig.color} />}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
})
