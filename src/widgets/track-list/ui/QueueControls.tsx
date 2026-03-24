import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { COLORS, FONT_SIZES } from 'shared/ui/themed'
import { queueControlsStyles } from './styles'

interface QueueControlsProps {
  onPressPlayAll: () => void
  onPressShuffle?: () => void
}

export const QueueControls = ({ onPressPlayAll, onPressShuffle }: QueueControlsProps) => (
  <View style={queueControlsStyles.container}>
    <TouchableOpacity
      onPress={onPressPlayAll}
      testID='queue-controls-play-all'
      style={queueControlsStyles.button}
    >
      <MaterialCommunityIcons name='play' size={FONT_SIZES.base} color={COLORS.onPrimary} />
      <Text style={queueControlsStyles.buttonText}>Воспроизвести все</Text>
    </TouchableOpacity>
    {onPressShuffle && (
      <TouchableOpacity
        onPress={onPressShuffle}
        testID='queue-controls-shuffle'
        style={queueControlsStyles.button}
      >
        <MaterialCommunityIcons
          name='shuffle-variant'
          size={FONT_SIZES.base}
          color={COLORS.onPrimary}
        />
        <Text style={queueControlsStyles.buttonText}>Перемешать</Text>
      </TouchableOpacity>
    )}
  </View>
)
