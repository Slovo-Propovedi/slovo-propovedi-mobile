import { StyleSheet, View } from 'react-native'
import { INDENTS } from 'shared/ui/theme'
import { ValueSlider } from 'shared/ui/value-slider'
import { SectionHeader } from './SectionHeader'
import { formatPercent } from './soundSettingsFormat'

const VOLUME_LABEL = 'Громкость'

export const VolumeSection = ({
  onReset,
  onVolumeApply,
  onVolumeChange,
  volume,
}: {
  onReset: () => void
  onVolumeApply: (volume: number) => void
  onVolumeChange: (volume: number) => void
  volume: number
}) => (
  <View style={styles.section}>
    <SectionHeader onReset={onReset} title={VOLUME_LABEL} value={formatPercent(volume)} />
    <ValueSlider
      max={1}
      min={0}
      step={0.05}
      value={volume}
      onChange={onVolumeApply}
      accessibilityLabel={VOLUME_LABEL}
      onSlidingComplete={onVolumeChange}
    />
  </View>
)

const styles = StyleSheet.create({
  section: { marginBottom: INDENTS.high },
})
