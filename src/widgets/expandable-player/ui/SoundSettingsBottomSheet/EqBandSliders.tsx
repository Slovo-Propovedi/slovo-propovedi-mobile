import { StyleSheet, View } from 'react-native'
import { INDENTS } from 'shared/ui/theme'
import { ValueSlider } from 'shared/ui/value-slider'
import { SectionHeader } from './SectionHeader'
import { formatBandFrequency, formatGainDb } from './soundSettingsFormat'

interface EqBandSlidersProps {
  bandFrequencies: number[]
  gains: number[]
  onBandChange: (index: number, gain: number) => void
  onBandComplete: (index: number, gain: number) => void
  range: [number, number]
}

export const EqBandSliders = ({
  bandFrequencies,
  gains,
  onBandChange,
  onBandComplete,
  range,
}: EqBandSlidersProps) => {
  const [min, max] = range

  return (
    <View>
      {gains.map((gain, index) => {
        const bandLabel = formatBandFrequency(bandFrequencies[index], index)

        return (
          <View style={styles.band} key={`${bandLabel}-${index}`}>
            <SectionHeader title={bandLabel} value={formatGainDb(gain)} />
            <ValueSlider
              step={1}
              max={max}
              min={min}
              value={gain}
              onChange={value => onBandChange(index, value)}
              accessibilityLabel={`Эквалайзер: ${bandLabel}`}
              onSlidingComplete={value => onBandComplete(index, value)}
            />
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  band: { marginBottom: INDENTS.middle },
})
