import { type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { OnboardingTarget } from 'features/onboarding'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'

export interface PlaylistMenuRowProps {
  icon: ReactNode
  isDisabled?: boolean
  isFlush?: boolean
  onboardingTargetId?: string
  onPress: () => void
  text: string
  textColor?: string
}

export const PlaylistMenuRow = ({
  icon,
  isDisabled = false,
  isFlush = false,
  onboardingTargetId,
  onPress,
  text,
  textColor,
}: PlaylistMenuRowProps) => {
  const { currentTheme } = useTheme()
  const handlePress = () => {
    if (isDisabled) return
    onPress()
  }

  return (
    <OnboardingTarget id={onboardingTargetId}>
      <PressableButton
        onPress={handlePress}
        style={[
          styles.dropdownItem,
          isFlush && styles.dropdownItemFlush,
          isDisabled && styles.dropdownItemDisabled,
        ]}
      >
        <View style={styles.dropdownIcon}>{icon}</View>
        <Text
          style={[
            styles.dropdownItemText,
            { color: isDisabled ? currentTheme.textMuted : currentTheme.text },
            textColor !== undefined && { color: textColor },
          ]}
        >
          {text}
        </Text>
      </PressableButton>
    </OnboardingTarget>
  )
}

const styles = StyleSheet.create({
  dropdownIcon: { marginRight: INDENTS.low },
  dropdownItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  dropdownItemDisabled: { opacity: 0.5 },
  // In the share modal the rows line up with the QR card's left edge instead
  // of the menu dropdown's indent.
  dropdownItemFlush: { paddingHorizontal: 0 },
  dropdownItemText: { fontSize: FONT_SIZES.base },
})
