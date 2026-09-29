import { StyleSheet, Text, View } from 'react-native'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { ValueSlider } from 'shared/ui/value-slider'
import { SectionHeader } from './SectionHeader'
import { formatBalance } from './soundSettingsFormat'

const BALANCE_LABEL = 'Баланс'
const BALANCE_LEFT_LABEL = 'Левый'
const BALANCE_RIGHT_LABEL = 'Правый'

export const BalanceSection = ({
  balance,
  onBalanceApply,
  onBalanceChange,
  onReset,
}: {
  balance: number
  onBalanceApply: (balance: number) => void
  onBalanceChange: (balance: number) => void
  onReset: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.section}>
      <SectionHeader onReset={onReset} title={BALANCE_LABEL} value={formatBalance(balance)} />
      <ValueSlider
        max={1}
        min={-1}
        step={0.05}
        value={balance}
        onChange={onBalanceApply}
        accessibilityLabel={BALANCE_LABEL}
        onSlidingComplete={onBalanceChange}
      />
      <View style={styles.sideLabels}>
        <Text style={[styles.sideLabel, { color: currentTheme.textMuted }]}>
          {BALANCE_LEFT_LABEL}
        </Text>
        <Text style={[styles.sideLabel, { color: currentTheme.textMuted }]}>
          {BALANCE_RIGHT_LABEL}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: INDENTS.high },
  sideLabel: { fontSize: FONT_SIZES.sm },
  sideLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: INDENTS.lowest,
  },
})
