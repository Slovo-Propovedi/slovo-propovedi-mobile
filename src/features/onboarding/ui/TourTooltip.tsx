import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, Text, View } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { PressableButton } from 'shared/ui/pressable-button/PressableButton'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { type OnboardingStep } from '../lib/scenarios'
import { useStepText } from '../lib/useStepText'
import { resolveWaitHint } from '../lib/waitHint'

export const TourTooltip = ({
  displayIndex,
  displayTotal,
  isFirstVisible,
  isLastVisible,
  isWaitSatisfied,
  onClose,
  onNext,
  onPrev,
  step,
}: {
  displayIndex: number
  displayTotal: number
  isFirstVisible: boolean
  isLastVisible: boolean
  isWaitSatisfied: boolean
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  step: OnboardingStep
}) => {
  const { currentTheme } = useTheme()
  const text = useStepText(step.text)
  const isWaiting = step.waitFor !== undefined && !isWaitSatisfied
  const waitHint = resolveWaitHint(step.waitFor)

  return (
    <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{step.title}</Text>
        <IconButton
          onPress={onClose}
          accessibilityLabel='Завершить обзор'
          Icon={<Ionicons size={22} name='close-outline' color={currentTheme.text} />}
        />
      </View>
      <Text style={[styles.text, { color: currentTheme.text }]}>{text}</Text>
      <Text style={[styles.counter, { color: currentTheme.textMuted }]}>
        {`Шаг ${displayIndex + 1} из ${displayTotal}`}
      </Text>
      <View style={styles.buttons}>
        {isFirstVisible ? null : (
          <PressableButton onPress={onPrev} style={styles.secondaryButton}>
            <Text style={[styles.secondaryText, { color: currentTheme.text }]}>Назад</Text>
          </PressableButton>
        )}
        {isWaiting ? (
          <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{waitHint}</Text>
        ) : (
          <PressableButton
            onPress={onNext}
            style={[styles.primaryButton, { backgroundColor: currentTheme.primary }]}
          >
            <Text style={[styles.primaryText, { color: currentTheme.onPrimary }]}>
              {isLastVisible ? 'Готово' : 'Далее'}
            </Text>
          </PressableButton>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
    gap: INDENTS.medium,
    justifyContent: 'flex-end',
    marginTop: INDENTS.high,
  },
  card: {
    borderRadius: RADIUSES.high,
    padding: INDENTS.high,
  },
  counter: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.medium,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hint: {
    flexShrink: 1,
    fontSize: FONT_SIZES.sm,
    textAlign: 'right',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.middle,
  },
  primaryText: {
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.middle,
  },
  secondaryText: {
    fontSize: FONT_SIZES.base,
  },
  text: {
    fontSize: FONT_SIZES.base,
    marginTop: INDENTS.low,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
})
