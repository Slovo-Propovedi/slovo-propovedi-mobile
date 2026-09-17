import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback } from 'react'
import { type ColorValue, type StyleProp, StyleSheet, type ViewStyle } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { FONT_SIZES, useTheme } from 'shared/ui/theme'
import { type RepeatMode, repeatModeAtom, setRepeatModeAction } from '../model'

interface PlayerRepeatToggleProps {
  style?: StyleProp<ViewStyle>
}

const REPEAT_MODES: RepeatMode[] = ['off', 'track', 'queue']

interface IconConfig {
  color: ColorValue
  name: keyof typeof MaterialCommunityIcons.glyphMap
}

const getRepeatIcon = (mode: RepeatMode, primaryColor: ColorValue): IconConfig => {
  switch (mode) {
    case 'off':
      return { color: '#9ca3af', name: 'repeat-off' }
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

export const PlayerRepeatToggle = ({ style }: PlayerRepeatToggleProps) => {
  const { currentTheme } = useTheme()
  const [repeatMode] = useAtom(repeatModeAtom)
  const setRepeatMode = useAction(setRepeatModeAction)

  const handlePress = useCallback(() => {
    const currentIndex = REPEAT_MODES.indexOf(repeatMode)
    const nextIndex = (currentIndex + 1) % REPEAT_MODES.length
    void setRepeatMode(REPEAT_MODES[nextIndex])
  }, [repeatMode, setRepeatMode])

  const iconConfig = getRepeatIcon(repeatMode, currentTheme.primary)

  return (
    <IconButton
      onPress={handlePress}
      style={[styles.container, style]}
      accessibilityLabel={getRepeatLabel(repeatMode)}
      Icon={
        <MaterialCommunityIcons
          size={FONT_SIZES.xxl}
          name={iconConfig.name}
          color={iconConfig.color}
        />
      }
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
