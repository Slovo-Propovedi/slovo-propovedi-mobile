import { WEB_BAND_FREQUENCIES_HZ } from './webCapabilities'

export interface WebEffectsGraph {
  balanceNode: null | StereoPannerNode
  context: AudioContext
  filters: BiquadFilterNode[]
}

export interface WebEffectsSettings {
  balance: number
  eqEnabled: boolean
  eqGains: number[]
}

type AudioContextCtor = new () => AudioContext

interface GlobalScopeWithAudio {
  AudioContext?: AudioContextCtor
  webkitAudioContext?: AudioContextCtor
}

// Safari exposes the constructor under a vendor prefix on older versions.
export const resolveAudioContextCtor = (): AudioContextCtor | null => {
  const scope = globalThis as GlobalScopeWithAudio

  return scope.AudioContext ?? scope.webkitAudioContext ?? null
}

const createEqFilters = (context: AudioContext): BiquadFilterNode[] =>
  WEB_BAND_FREQUENCIES_HZ.map(frequency => {
    const filter = context.createBiquadFilter()

    filter.type = 'peaking'
    filter.frequency.value = frequency
    filter.Q.value = 1
    filter.gain.value = 0

    return filter
  })

/**
 * Wires one element's effects graph: source → EQ chain → balance → destination.
 *
 * The graph is built once per element (`createMediaElementSource` reroutes the
 * element's audio permanently and can only be called once). Failure handling:
 * without `AudioContext` the caller degrades to no-ops; without
 * `StereoPannerNode` (old Safari) the EQ chain connects straight to the
 * destination so audio stays audible and only balance is lost.
 * @param element - Audio element to reroute into the effects graph.
 * @param contextCtor - AudioContext constructor (standard or webkit-prefixed).
 * @returns The built graph, or null when Web Audio is unavailable or fails.
 */
export const createWebEffectsGraph = (
  element: HTMLAudioElement,
  contextCtor: AudioContextCtor,
): null | WebEffectsGraph => {
  try {
    const context = new contextCtor()
    const source = context.createMediaElementSource(element)
    const filters = createEqFilters(context)
    const balanceNode = context.createStereoPanner?.() ?? null

    let node: AudioNode = source

    for (const filter of filters) {
      node.connect(filter)
      node = filter
    }

    if (balanceNode) {
      node.connect(balanceNode)
      balanceNode.connect(context.destination)
    } else node.connect(context.destination)

    // Contexts created outside a user gesture start suspended; the first
    // slider interaction is a gesture, so resume can succeed here already.
    void context.resume().catch(() => {})

    return { balanceNode, context, filters }
  } catch (error) {
    console.error('[audio-effects] Web Audio graph setup failed:', error)
    return null
  }
}

/**
 * Pushes stored settings into the graph; disabled EQ means all gains at 0.
 * @param graph - Effects graph of the current audio element.
 * @param settings - Balance and equalizer values to apply.
 */
export const applySettingsToGraph = (
  graph: WebEffectsGraph,
  settings: WebEffectsSettings,
): void => {
  graph.filters.forEach((filter, band) => {
    filter.gain.value = settings.eqEnabled ? (settings.eqGains[band] ?? 0) : 0
  })

  if (graph.balanceNode) graph.balanceNode.pan.value = settings.balance
}
