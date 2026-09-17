import { Entypo } from '@expo/vector-icons'
import {
  type GestureResponderEvent,
  type OpaqueColorValue,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native'
import { match } from 'ts-pattern'
import { IconButton } from '../icon-button'
import { COLORS } from '../theme/colors'
import { PlayerControlButtonType } from './control-button.types'

interface PlayerControlButtonProps {
  color?: OpaqueColorValue | string
  isDisabled?: boolean | null
  onLongPress?: (event: GestureResponderEvent) => void
  onPress?: (event: GestureResponderEvent) => void
  onPressOut?: (event: GestureResponderEvent) => void
  size?: number
  style?: StyleProp<ViewStyle>
  type: PlayerControlButtonType
}

const getControlLabel = (type: PlayerControlButtonType): string =>
  match(type)
    .with(PlayerControlButtonType.Next, () => 'Следующая проповедь')
    .with(PlayerControlButtonType.Pause, () => 'Пауза')
    .with(PlayerControlButtonType.Play, () => 'Воспроизвести')
    .with(PlayerControlButtonType.Prev, () => 'Предыдущая проповедь')
    .exhaustive()

export const PlayerControlButton = ({
  color,
  isDisabled,
  onLongPress,
  onPress,
  onPressOut,
  size = 24,
  style,
  type,
}: PlayerControlButtonProps) => (
  <IconButton
    style={style}
    onPress={onPress}
    onPressOut={onPressOut}
    onLongPress={onLongPress}
    disabled={Boolean(isDisabled)}
    accessibilityLabel={getControlLabel(type)}
    Icon={
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
    }
  />
)

const styles = StyleSheet.create({
  icon: {
    color: COLORS.black,
  },
  iconDisabled: {
    color: COLORS.disabled,
  },
})
