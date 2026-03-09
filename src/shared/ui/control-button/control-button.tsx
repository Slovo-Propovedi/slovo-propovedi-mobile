import { Entypo } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { COLORS } from 'shared/themed'
import type { GestureResponderEvent, OpaqueColorValue, StyleProp, ViewStyle } from 'react-native'
import { PlayerControlButtonType } from './control-button.types'

interface PlayerControlButtonProps {
  color?: OpaqueColorValue | string
  isDisabled?: boolean | null
  onLongPress?: (event: GestureResponderEvent) => void
  onPress?: (event: GestureResponderEvent) => void
  onPressOut?: (event: GestureResponderEvent) => void
  size?: number
  style?: StyleProp<ViewStyle>
  testID?: string
  type: PlayerControlButtonType
}

export const PlayerControlButton = ({
  color,
  isDisabled,
  onLongPress,
  onPress,
  onPressOut,
  size = 24,
  style,
  testID,
  type,
}: PlayerControlButtonProps) => (
  <TouchableOpacity
    style={style}
    testID={testID}
    onPress={onPress}
    onPressOut={onPressOut}
    onLongPress={onLongPress}
    disabled={Boolean(isDisabled)}
  >
    <Text>
      <Entypo
        size={size}
        style={[styles.icon, color ? { color } : null, isDisabled && styles.iconDisabled]}
        name={
          {
            [PlayerControlButtonType.Next]: 'controller-fast-forward' as const,
            [PlayerControlButtonType.Pause]: 'controller-paus' as const,
            [PlayerControlButtonType.Play]: 'controller-play' as const,
            [PlayerControlButtonType.Prev]: 'controller-fast-backward' as const,
          }[type]
        }
      />
    </Text>
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  icon: {
    color: COLORS.black,
  },
  iconDisabled: {
    color: COLORS.disabled,
  },
})
