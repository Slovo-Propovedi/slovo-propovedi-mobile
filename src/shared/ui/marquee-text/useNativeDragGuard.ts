import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'

const isDomNode = (node: unknown): node is HTMLElement =>
  typeof node === 'object' && node !== null && 'addEventListener' in node

// Web-only: prevents native HTML5 drag (`dragstart`) on the container element.
// On desktop web, the browser fires `dragstart` on `<img>` elements inside rows,
// which hijacks mouse drags and prevents RNGH's Pointer Events from reaching the
// gesture handler. Blocking `dragstart` at the capture phase restores RNGH pan
// activation without affecting touch or native. The container also carries the
// `data-marquee-drag` marker so the slider's mouse-drag hook can exclude drags
// that start on a marquee title (they must scrub only the title, not the row).
export const useNativeDragGuard = () => {
  const [node, setNode] = useState<HTMLElement | null>(null)

  const containerRef = useCallback((instance: unknown) => {
    setNode(isDomNode(instance) ? instance : null)
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'web' || !node) return
    const handleDragStart = (e: Event) => {
      e.preventDefault()
    }
    // eslint-disable-next-line react-hooks/immutability -- DOM side effect: the marker is read by the slider's drag hook via closest()
    node.dataset.marqueeDrag = 'true'
    node.addEventListener('dragstart', handleDragStart, { capture: true })
    return () => {
      node.removeEventListener('dragstart', handleDragStart, { capture: true })

      delete node.dataset.marqueeDrag
    }
  }, [node])

  return containerRef
}
