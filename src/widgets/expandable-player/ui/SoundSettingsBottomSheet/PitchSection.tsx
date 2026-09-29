import { StyleSheet, View } from 'react-native'
import { formatPlaybackRate } from 'shared/lib/player'
import { INDENTS } from 'shared/ui/theme'
import { ValueSlider } from 'shared/ui/value-slider'
import { SectionHeader } from './SectionHeader'

const PITCH_LABEL = 'Высота тона'

export const PitchSection = ({
  onPitchApply,
  onPitchChange,
  onReset,
  pitch,
}: {
  onPitchApply: (pitch: number) => void
  onPitchChange: (pitch: number) => void
  onReset: () => void
  pitch: number
}) => (
  <View style={styles.section}>
    <SectionHeader onReset={onReset} title={PITCH_LABEL} value={formatPlaybackRate(pitch)} />
    <ValueSlider
      max={2}
      min={0.5}
      step={0.05}
      value={pitch}
      onChange={onPitchApply}
      accessibilityLabel={PITCH_LABEL}
      onSlidingComplete={onPitchChange}
    />
  </View>
)

const styles = StyleSheet.create({
  section: { marginBottom: INDENTS.high },
})
