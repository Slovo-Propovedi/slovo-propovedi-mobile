import { MaterialCommunityIcons } from '@expo/vector-icons'
import { type RefObject } from 'react'
import { type ColorValue, View, type ViewInstance } from 'react-native'
import { OnboardingTarget } from 'features/onboarding'
import { IconButton } from 'shared/ui/icon-button'
import { resolveColor, useTheme } from 'shared/ui/theme'
import { headerMenuButtonStyles } from './styles'

const ICON_SIZE = 24

/**
 * The header menu trigger: a dots icon button anchored to its wrapper view.
 * @param props - Trigger configuration.
 * @param props.accessibilityLabel - Screen-reader name of the button.
 * @param props.buttonRef - Ref to the wrapper view used as the dropdown anchor.
 * @param props.iconColor - Icon tint; defaults to the theme text color.
 * @param props.onPress - Opens the menu.
 * @param props.onboardingTargetId - Optional onboarding target id for the trigger.
 */
export const PlaylistHeaderMenuButton = ({
  accessibilityLabel,
  buttonRef,
  iconColor,
  onboardingTargetId,
  onPress,
}: {
  accessibilityLabel: string
  buttonRef: RefObject<null | ViewInstance>
  iconColor?: ColorValue
  onboardingTargetId?: string
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <OnboardingTarget id={onboardingTargetId}>
      <View ref={buttonRef} collapsable={false}>
        <IconButton
          onPress={onPress}
          style={headerMenuButtonStyles.button}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint='Нажмите чтобы открыть меню'
          Icon={
            <MaterialCommunityIcons
              size={ICON_SIZE}
              name='dots-horizontal'
              color={resolveColor(iconColor, currentTheme.text)}
            />
          }
        />
      </View>
    </OnboardingTarget>
  )
}
