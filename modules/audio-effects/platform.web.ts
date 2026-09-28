import type { AudioEffectsInfo, AudioEffectsSettings } from './types'
import { WEB_AUDIO_EFFECTS_INFO } from './webCapabilities'
import {
  applySettingsToGraph,
  createWebEffectsGraph,
  resolveAudioContextCtor,
  type WebEffectsGraph,
  type WebEffectsSettings,
} from './webEffectsGraph'

// The module owns web audio effects as a per-element graph:
// MediaElementAudioSourceNode → 5 peaking BiquadFilterNodes (EQ) →
// StereoPannerNode (balance) → destination. `createMediaElementSource` can be
// called once per element and permanently reroutes its audio into the graph,
// so graphs are built lazily on the first effect call (a user gesture — this
// also lets the AudioContext resume) and cached per element.
const graphs = new WeakMap<HTMLAudioElement, WebEffectsGraph>()

let currentElement: HTMLAudioElement | null = null

// Last-known settings, mirroring the native module's stored state: applied to
// the graph whenever it is created or a setter fires.
let storedSettings: WebEffectsSettings = { balance: 0, eqEnabled: false, eqGains: [] }

export const registerWebAudioElement = (element: HTMLAudioElement | null): void => {
  currentElement = element
}

const ensureGraph = (): null | WebEffectsGraph => {
  if (!currentElement) return null

  const existing = graphs.get(currentElement)
  if (existing) return existing

  const contextCtor = resolveAudioContextCtor()
  if (!contextCtor) return null

  const graph = createWebEffectsGraph(currentElement, contextCtor)
  if (!graph) return null

  graphs.set(currentElement, graph)
  applySettingsToGraph(graph, storedSettings)
  return graph
}

const withGraph = (apply: (graph: WebEffectsGraph) => void): void => {
  const graph = ensureGraph()
  if (graph) apply(graph)
}

export const attachAudioEffects = async (
  _playerHandle: unknown,
  settings: AudioEffectsSettings,
): Promise<AudioEffectsInfo> => {
  storedSettings = {
    balance: settings.balance,
    eqEnabled: settings.eqEnabled,
    eqGains: [...settings.eqGains],
  }
  withGraph(graph => applySettingsToGraph(graph, storedSettings))
  return WEB_AUDIO_EFFECTS_INFO
}

export const detachAudioEffects = (): void => {
  storedSettings = { balance: 0, eqEnabled: false, eqGains: [] }
  withGraph(graph => applySettingsToGraph(graph, storedSettings))
}

export const getAudioEffectsInfo = (): AudioEffectsInfo => WEB_AUDIO_EFFECTS_INFO

export const setAudioEffectsBalance = (center: number): void => {
  storedSettings.balance = center
  withGraph(graph => applySettingsToGraph(graph, storedSettings))
}

export const setAudioEffectsEqualizerEnabled = (enabled: boolean): void => {
  storedSettings.eqEnabled = enabled
  withGraph(graph => applySettingsToGraph(graph, storedSettings))
}

export const setAudioEffectsEqualizerBandGain = (index: number, gainDb: number): void => {
  // Bounds are guarded by the caller (audioEffectsPreferences); a stray
  // out-of-range index would only grow the stored array, and the graph ignores
  // gains beyond its 5 filters.
  storedSettings.eqGains[index] = gainDb
  withGraph(graph => applySettingsToGraph(graph, storedSettings))
}

// Pitch-independent-of-rate playback is not feasible for an HTMLMediaElement:
// playbackRate changes tempo and pitch together. The setter stays a no-op and
// `WEB_AUDIO_EFFECTS_INFO.pitchSupported` keeps the sheet section hidden.
export const setAudioEffectsPitch = (): void => {}

export const openAudioOutputSwitcher = (): void => {}
