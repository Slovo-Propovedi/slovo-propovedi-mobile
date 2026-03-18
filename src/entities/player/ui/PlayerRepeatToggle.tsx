import { useAction, useAtom } from '@reatom/npm-react'
import React, { useCallback } from 'react'
import { Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native'
import { FONT_SIZES } from 'shared/ui/themed'
import { type RepeatMode, repeatModeAtom, setRepeatModeAction } from '../model'

interface PlayerRepeatToggleProps {
  style?: StyleProp<ViewStyle>
}

const REPEAT_MODES: RepeatMode[] = ['off', 'track', 'queue']

const getRepeatIcon = (mode: RepeatMode): string => {
  switch (mode) {
    case 'off':
      return '➡️'
    case 'queue':
      return '🔁'
    case 'track':
      return '🔂'
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

  return (
    <Pressable onPress={handlePress} style={[styles.container, style]}>
      <Text style={styles.icon}>{getRepeatIcon(repeatMode)}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  icon: {
    fontSize: FONT_SIZES.xl,
  },
})
