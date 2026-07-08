import { Entypo } from '@expo/vector-icons'
import {
  type GestureResponderEvent,
  type OpaqueColorValue,
  type StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native'
import { match } from 'ts-pattern'
import { COLORS } from '../themed'
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
        name={match(type)
          .with(PlayerControlButtonType.Next, () => 'controller-fast-forward' as const)
          .with(PlayerControlButtonType.Pause, () => 'controller-paus' as const)
          .with(PlayerControlButtonType.Play, () => 'controller-play' as const)
          .with(PlayerControlButtonType.Prev, () => 'controller-fast-backward' as const)
          .exhaustive()}
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
