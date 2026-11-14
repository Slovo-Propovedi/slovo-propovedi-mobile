import Ionicons from '@expo/vector-icons/Ionicons'
import { useAction } from '@reatom/npm-react'
import { type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native'
import { OnboardingTarget } from 'features/onboarding'
import { shareLink } from 'shared/lib/shareLink'
import { showToast } from 'shared/model'
import { FONT_SIZES, RADIUSES, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { SHARE_MESSAGE } from '../lib/constants'

const SHARE_ERROR_MESSAGE = 'Не удалось поделиться. Попробуйте ещё раз'

export const ShareLinkButton = ({
  onboardingTargetId,
  style,
  url,
}: {
  onboardingTargetId?: string
  style?: StyleProp<ViewStyle>
  url: string
}) => {
  const { currentTheme } = useTheme()
  const showToastAction = useAction(showToast)

  const handleShare = async () => {
    const result = await shareLink({ text: `${SHARE_MESSAGE}\n${url}`, url })
    if (result === 'error') showToastAction(SHARE_ERROR_MESSAGE)
  }

  return (
    <OnboardingTarget id={onboardingTargetId}>
      <TouchableItem
        onPress={() => void handleShare()}
        style={[styles.button, { backgroundColor: currentTheme.surface }, style]}
      >
        <Ionicons size={24} style={styles.icon} name='share-outline' color={currentTheme.primary} />
        <Text style={[styles.title, { color: currentTheme.text }]}>Поделиться ссылкой</Text>
      </TouchableItem>
    </OnboardingTarget>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flexDirection: 'row',
    padding: 16,
  },
  icon: { marginRight: 12 },
  title: { fontSize: FONT_SIZES.base },
})
