import { useAtom } from '@reatom/npm-react'
import { StyleSheet, Text, View } from 'react-native'
import { currentAudioAtom } from 'entities/player'
import { MarqueeText } from 'shared/ui'
import { FONT_SIZES, useTheme } from 'shared/ui/theme'
import { PlayingWave } from './PlayingWave'

export const NOW_PLAYING_LABEL = 'Воспроизводится'
const WAVE_OPACITY = 0.45

export const NowPlayingLayer = () => {
  const { currentTheme } = useTheme()
  const [currentAudio] = useAtom(currentAudioAtom)

  return (
    <View style={styles.waveLayer}>
      <View style={styles.waveBackground}>
        <PlayingWave />
      </View>
      <View style={styles.labelColumn}>
        <Text style={[styles.nowPlayingText, { color: currentTheme.text }]}>
          {NOW_PLAYING_LABEL}
        </Text>
        {currentAudio ? (
          <View style={styles.marqueeZone}>
            <MarqueeText
              centerWhenStatic
              text={currentAudio.title}
              textStyle={[styles.secondaryLabel, { color: currentTheme.text }]}
            />
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  labelColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  marqueeZone: {
    width: '78%',
  },
  nowPlayingText: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', textAlign: 'center' },
  secondaryLabel: { fontSize: FONT_SIZES.sm, textAlign: 'center' },
  waveBackground: { ...StyleSheet.absoluteFill, opacity: WAVE_OPACITY },
  waveLayer: { alignItems: 'center', aspectRatio: 2.3, justifyContent: 'center', width: '100%' },
})
