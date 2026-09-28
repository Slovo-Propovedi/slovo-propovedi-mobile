const createDefaultInfo = () => ({
  balanceSupported: false,
  bandCount: 0,
  bandFrequencies: [],
  bandRange: [-15, 15],
  eqSupported: false,
  outputSwitcherSupported: false,
  pitchSupported: false,
})

jest.mock('audio-effects', () => ({
  // Native attach resolves after the main-queue hop — a promise in production.
  attachAudioEffects: jest.fn(() => Promise.resolve(createDefaultInfo())),
  detachAudioEffects: jest.fn(),
  getAudioEffectsInfo: jest.fn(createDefaultInfo),
  openAudioOutputSwitcher: jest.fn(),
  registerWebAudioElement: jest.fn(),
  setAudioEffectsBalance: jest.fn(),
  setAudioEffectsEqualizerBandGain: jest.fn(),
  setAudioEffectsEqualizerEnabled: jest.fn(),
  setAudioEffectsPitch: jest.fn(),
}))
