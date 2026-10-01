import { type AudioEffectsInfo } from 'audio-effects'
import { gainsForDevice } from './audioEffectsCapabilities'

const DEFAULT_BAND_GAIN_DB = 0

const infoWithBandCount = (bandCount: number): AudioEffectsInfo => ({
  balanceSupported: false,
  bandCount,
  bandFrequencies: [],
  bandRange: [-15, 15],
  eqSupported: false,
  outputSwitcherSupported: false,
  pitchSupported: false,
})

describe('gainsForDevice', () => {
  test('pads a shorter gains array with the default gain', () => {
    const gains = [1, 2, 3]

    expect(gainsForDevice(gains, infoWithBandCount(5))).toEqual([
      ...gains,
      DEFAULT_BAND_GAIN_DB,
      DEFAULT_BAND_GAIN_DB,
    ])
  })

  test('truncates a longer gains array to the device band count', () => {
    expect(gainsForDevice([1, 2, 3, 4], infoWithBandCount(2))).toEqual([1, 2])
  })

  test('returns null when the array already matches the device', () => {
    expect(gainsForDevice([1, 2], infoWithBandCount(2))).toBeNull()
  })

  test('returns null when the device reports no equalizer bands', () => {
    expect(gainsForDevice([1, 2], infoWithBandCount(0))).toBeNull()
  })

  test('fills sparse holes with the default gain', () => {
    const sparseGains: number[] = []
    sparseGains[0] = 1
    sparseGains[2] = 3

    expect(gainsForDevice(sparseGains, infoWithBandCount(5))).toEqual([1, 0, 3, 0, 0])
  })
})
