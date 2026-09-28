import { StyleSheet, View } from 'react-native'
import { useAudioSettings, usePlayer, useVolume } from 'entities/player'
import { INDENTS } from 'shared/ui/theme'
import { BalanceSection } from './BalanceSection'
import { EqualizerSection } from './EqualizerSection'
import { OutputSection } from './OutputSection'
import { PitchSection } from './PitchSection'
import { VolumeSection } from './VolumeSection'

const VOLUME_DEFAULT = 1
const BALANCE_DEFAULT = 0
const PITCH_DEFAULT = 1

export const SoundSettingsContent = () => {
  const {
    applyBalance,
    applyEqBandGain,
    applyPitch,
    balance,
    bandCount,
    eqEnabled,
    eqGains,
    eqInfo,
    pitch,
    setBalance,
    setEqBandGain,
    setEqEnabled,
    setPitch,
  } = useAudioSettings()
  const { applyVolume, setVolume } = usePlayer()
  const volume = useVolume()

  return (
    <View style={styles.content}>
      {/* Volume is always available: web drives HTMLMediaElement.volume,
          native drives the expo-audio player. */}
      <VolumeSection
        volume={volume}
        onVolumeApply={applyVolume}
        onReset={() => void setVolume(VOLUME_DEFAULT)}
        onVolumeChange={value => void setVolume(value)}
      />
      {eqInfo?.balanceSupported && (
        <BalanceSection
          balance={balance}
          onBalanceChange={setBalance}
          onBalanceApply={applyBalance}
          onReset={() => setBalance(BALANCE_DEFAULT)}
        />
      )}
      {eqInfo?.eqSupported && (
        <EqualizerSection
          eqGains={eqGains}
          bandCount={bandCount}
          eqEnabled={eqEnabled}
          range={eqInfo.bandRange}
          onSetEnabled={setEqEnabled}
          onSetBandGain={setEqBandGain}
          onApplyBandGain={applyEqBandGain}
          bandFrequencies={eqInfo.bandFrequencies}
        />
      )}
      {eqInfo?.pitchSupported && (
        <PitchSection
          pitch={pitch}
          onPitchChange={setPitch}
          onPitchApply={applyPitch}
          onReset={() => setPitch(PITCH_DEFAULT)}
        />
      )}
      {/* The system output panel exists only on Android 11+ (native flag). */}
      {eqInfo?.outputSwitcherSupported && <OutputSection />}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { paddingBottom: INDENTS.highest, paddingHorizontal: INDENTS.medium },
})
