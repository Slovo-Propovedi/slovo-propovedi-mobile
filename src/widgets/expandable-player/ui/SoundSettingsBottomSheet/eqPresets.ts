// Gain arrays are written for a 5-band equalizer (EQUALIZER_BAND_COUNT in
// entities/player). «Голос» lifts the 1–2 kHz bands where speech lives.
export interface EqualizerPreset {
  gains: number[]
  id: string
  label: string
}

export const EQ_PRESETS: EqualizerPreset[] = [
  { gains: [0, 0, 0, 0, 0], id: 'flat', label: 'Ровно' },
  { gains: [-2, 1, 4, 2, 0], id: 'vocal', label: 'Голос' },
  { gains: [6, 4, 2, 0, 0], id: 'bass', label: 'Бас' },
  { gains: [0, 0, 2, 4, 6], id: 'treble', label: 'Высокие' },
]

export const findActivePreset = (gains: number[]): EqualizerPreset | undefined =>
  EQ_PRESETS.find(preset => preset.gains.every((gain, index) => gains[index] === gain))
