import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'

const DRAG_CLICK_THRESHOLD_PX = 5

const MARQUEE_DRAG_SELECTOR = '[data-marquee-drag]'

const isDomNode = (node: unknown): node is HTMLElement =>
  typeof node === 'object' && node !== null && 'addEventListener' in node

const isScrollableNode = (child: unknown): child is HTMLElement =>
  typeof child === 'object' && child !== null && 'scrollLeft' in child

const isElementWithClosest = (target: unknown): target is Element =>
  typeof target === 'object' && target !== null && 'closest' in target

// Web-only, mouse-only drag-to-scroll for the content slider. RNGH's web
// ScrollView does not respond to mouse drags, so desktop users could not
// scroll the row. This hook drives the native scrollLeft 1:1 from pointer
// movement; touch keeps the RNGH path untouched.
export const useMouseDragScroll = () => {
  const [node, setNode] = useState<HTMLElement | null>(null)

  const wrapperRef = useCallback((instance: unknown) => {
    setNode(isDomNode(instance) ? instance : null)
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'web' || !node) return

    let scrollable: HTMLElement | null = null
    let startScrollLeft = 0
    let startX = 0
    let movedDistance = 0
    let previousCursor = ''
    let clickGuard: ((e: Event) => void) | null = null

    const resolveScrollable = () => {
      if (!scrollable && isScrollableNode(node.firstElementChild))
        scrollable = node.firstElementChild

      return scrollable
    }

    const removeClickGuard = () => {
      if (!clickGuard) return
      node.removeEventListener('click', clickGuard, true)
      clickGuard = null
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!scrollable) return
      const deltaX = e.clientX - startX
      movedDistance = Math.max(movedDistance, Math.abs(deltaX))
      scrollable.scrollLeft = startScrollLeft - deltaX
      if (movedDistance > DRAG_CLICK_THRESHOLD_PX && !clickGuard) {
        clickGuard = (clickEvent: Event) => {
          clickEvent.preventDefault()
          clickEvent.stopPropagation()
          removeClickGuard()
        }
        node.addEventListener('click', clickGuard, true)
      }
    }

    const handlePointerUp = () => {
      endDrag()
    }

    const handlePointerCancel = () => {
      removeClickGuard()
      endDrag()
    }

    const endDrag = () => {
      if (scrollable) scrollable.style.cursor = previousCursor
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
    }

    const handlePointerDown = (e: PointerEvent) => {
      // A drag that starts on a marquee title must scrub only the title, not
      // the row: the marquee's own pan gesture owns that pointer.
      const target = e.target
      if (isElementWithClosest(target) && target.closest(MARQUEE_DRAG_SELECTOR)) return
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      const targetNode = resolveScrollable()
      if (!targetNode) return
      scrollable = targetNode
      startScrollLeft = targetNode.scrollLeft
      startX = e.clientX
      movedDistance = 0
      previousCursor = targetNode.style.cursor
      targetNode.style.cursor = 'grabbing'
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerCancel)
    }

    // Kills the native image "ghost drag" on cover images inside slider items:
    // the browser would otherwise start an HTML5 drag instead of letting the
    // pointer move scroll the row. Always active, not only while dragging.
    const handleDragStart = (e: Event) => {
      e.preventDefault()
    }

    node.addEventListener('pointerdown', handlePointerDown, true)
    node.addEventListener('dragstart', handleDragStart, true)
    return () => {
      node.removeEventListener('pointerdown', handlePointerDown, true)
      node.removeEventListener('dragstart', handleDragStart, true)
      removeClickGuard()
      endDrag()
    }
  }, [node])

  return wrapperRef
}
