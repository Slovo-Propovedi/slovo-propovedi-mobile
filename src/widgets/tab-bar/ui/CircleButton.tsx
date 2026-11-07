import { type PropsWithChildren } from 'react'
import { useTheme } from 'shared/ui/theme'
import { TouchableButton } from 'shared/ui/touchable-button'
import { ISLAND_BACKGROUND_DARK, ISLAND_BACKGROUND_LIGHT, styles } from './styles'

// Circular action floating beside the tab island (Apple-Music-style search chip).
export const CircleButton = ({
  accessibilityLabel,
  children,
  onPress,
}: PropsWithChildren<{ accessibilityLabel: string; onPress: () => void }>) => {
  const { isLight } = useTheme()

  return (
    <TouchableButton
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.circleButton,
        { backgroundColor: isLight ? ISLAND_BACKGROUND_LIGHT : ISLAND_BACKGROUND_DARK },
      ]}
    >
      {children}
    </TouchableButton>
  )
}
