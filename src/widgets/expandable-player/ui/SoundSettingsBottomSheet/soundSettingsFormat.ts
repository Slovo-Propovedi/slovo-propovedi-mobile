const BALANCE_LEFT_PREFIX = 'Л'
const BALANCE_RIGHT_PREFIX = 'П'
const BALANCE_CENTER_LABEL = 'Центр'
const GAIN_UNIT = 'дБ'
const HZ_UNIT = 'Гц'
const KHZ_UNIT = 'кГц'
const UNKNOWN_BAND_PREFIX = 'Полоса'
const KHZ_THRESHOLD = 1000

export const formatPercent = (value: number): string => `${Math.round(value * 100)}%`

export const formatBalance = (value: number): string => {
  if (value === 0) return BALANCE_CENTER_LABEL

  const percent = Math.round(Math.abs(value) * 100)

  return value < 0 ? `${BALANCE_LEFT_PREFIX} ${percent}` : `${BALANCE_RIGHT_PREFIX} ${percent}`
}

export const formatGainDb = (gain: number): string => {
  const rounded = Math.round(gain)

  return `${rounded > 0 ? '+' : ''}${rounded} ${GAIN_UNIT}`
}

export const formatBandFrequency = (frequency: number | undefined, index: number): string => {
  if (frequency === undefined) return `${UNKNOWN_BAND_PREFIX} ${index + 1}`
  if (frequency < KHZ_THRESHOLD) return `${frequency} ${HZ_UNIT}`

  const kHz = frequency / KHZ_THRESHOLD
  const label = Number.isInteger(kHz) ? String(kHz) : kHz.toFixed(1)

  return `${label} ${KHZ_UNIT}`
}
