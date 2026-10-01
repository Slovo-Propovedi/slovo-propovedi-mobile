import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { COLORS, FONT_SIZES, useTheme } from 'shared/ui/theme'
import { TouchableButton } from 'shared/ui/touchable-button'
import { queueControlsStyles } from './styles'

export const QueueControls = ({
  isDisabled = false,
  label,
  onPressPlayAll,
  onPressShuffle,
}: {
  isDisabled?: boolean
  label: string
  onPressPlayAll: () => void
  onPressShuffle?: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={queueControlsStyles.container}>
      <TouchableButton
        disabled={isDisabled}
        onPress={onPressPlayAll}
        style={[
          queueControlsStyles.button,
          { backgroundColor: currentTheme.primary },
          isDisabled && queueControlsStyles.disabledButton,
        ]}
      >
        <MaterialCommunityIcons name='play' size={FONT_SIZES.base} color={COLORS.onPrimary} />
        <Text style={queueControlsStyles.buttonText}>{label}</Text>
      </TouchableButton>
      {onPressShuffle && (
        <TouchableButton
          onPress={onPressShuffle}
          style={[queueControlsStyles.button, { backgroundColor: currentTheme.primary }]}
        >
          <MaterialCommunityIcons
            name='shuffle-variant'
            size={FONT_SIZES.base}
            color={COLORS.onPrimary}
          />
          <Text style={queueControlsStyles.buttonText}>Перемешать</Text>
        </TouchableButton>
      )}
    </View>
  )
}
