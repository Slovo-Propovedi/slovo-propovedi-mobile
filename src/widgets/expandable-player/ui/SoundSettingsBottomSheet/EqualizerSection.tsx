import { Checkbox } from 'expo-checkbox'
import { StyleSheet, Text, View } from 'react-native'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { EqBandSliders } from './EqBandSliders'
import { EqPresetChips } from './EqPresetChips'
import { findActivePreset } from './eqPresets'

const EQ_LABEL = 'Эквалайзер'

// The persisted gains may still have the canonical length while the device
// reports a different band count: pad zeros / truncate so the slider count
// always equals eqInfo.bandCount.
const normalizeGains = (gains: number[], bandCount: number): number[] =>
  Array.from({ length: bandCount }, (_, band) => gains[band] ?? 0)

export const EqualizerSection = ({
  bandCount,
  bandFrequencies,
  eqEnabled,
  eqGains,
  onApplyBandGain,
  onSetBandGain,
  onSetEnabled,
  range,
}: {
  bandCount: number
  bandFrequencies: number[]
  eqEnabled: boolean
  eqGains: number[]
  onApplyBandGain: (index: number, gainDb: number) => void
  onSetBandGain: (index: number, gainDb: number) => void
  onSetEnabled: (enabled: boolean) => void
  range: [number, number]
}) => {
  const { currentTheme } = useTheme()
  const displayGains = normalizeGains(eqGains, bandCount)
  const activePreset = findActivePreset(displayGains)

  const handlePresetSelect = (presetGains: number[]) => {
    presetGains.forEach((gain, index) => onSetBandGain(index, gain))
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{EQ_LABEL}</Text>
        <Checkbox
          value={eqEnabled}
          aria-label={EQ_LABEL}
          style={styles.checkbox}
          onValueChange={onSetEnabled}
          color={eqEnabled ? currentTheme.primary : undefined}
        />
      </View>
      {eqEnabled && (
        <>
          <EqPresetChips
            activePresetId={activePreset?.id ?? null}
            onSelect={preset => handlePresetSelect(preset.gains)}
          />
          <EqBandSliders
            range={range}
            gains={displayGains}
            onBandChange={onApplyBandGain}
            onBandComplete={onSetBandGain}
            bandFrequencies={bandFrequencies}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  checkbox: {
    borderRadius: 4,
    height: 22,
    marginLeft: 'auto',
    width: 22,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: INDENTS.low,
  },
  section: { marginBottom: INDENTS.high },
  title: { fontSize: FONT_SIZES.base },
})
