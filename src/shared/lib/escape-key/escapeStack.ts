import { isEscapeKey } from './isEscapeKey'

interface EscapeLayer {
  id: number
  onEscapeRef: { current: (event: KeyboardEvent) => void }
}

const layers: EscapeLayer[] = []
let nextLayerId = 0
let attachedTarget: Document | null = null

const isKeyboardEvent = (event: Event): event is KeyboardEvent => 'key' in event

const getDocument = (): Document | null => (typeof document === 'undefined' ? null : document)

const handleDocumentKeyDown = (event: Event) => {
  if (!isKeyboardEvent(event)) return
  if (!isEscapeKey(event)) return
  // A claimed Escape reaches exactly one layer — the topmost — and no
  // lower-priority bubble listeners.
  event.stopPropagation()
  const top = layers[layers.length - 1]
  if (!top) return
  top.onEscapeRef.current(event)
}

const attachListener = () => {
  const target = getDocument()
  if (!target || attachedTarget === target) return
  detachListener()
  target.addEventListener('keydown', handleDocumentKeyDown, { capture: true })
  attachedTarget = target
}

const detachListener = () => {
  if (!attachedTarget) return
  attachedTarget.removeEventListener('keydown', handleDocumentKeyDown, { capture: true })
  attachedTarget = null
}

export const pushEscapeLayer = (onEscapeRef: EscapeLayer['onEscapeRef']): number => {
  const id = nextLayerId++
  layers.push({ id, onEscapeRef })
  if (layers.length === 1) attachListener()
  return id
}

export const popEscapeLayer = (id: number): void => {
  const index = layers.findIndex(layer => layer.id === id)
  if (index === -1) return
  layers.splice(index, 1)
  if (layers.length === 0) detachListener()
}
