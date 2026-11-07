import { type ComponentRef, useEffect, useRef, useState } from 'react'
import { type View } from 'react-native'

// Start loading a little before the cover scrolls in (page and slider scroll).
const MARGIN = '300px'

/**
 * Web: reports when the cover's container comes near the viewport (or the
 * visible part of its horizontal slider) and stays `true` afterwards. Geometry
 * based, so it also works while the startup splash keeps `#root` hidden —
 * unlike the browser's `loading='lazy'`.
 * @param enabled - `false` reports `isNear` immediately (eager covers).
 */
export const useNearViewport = (enabled: boolean) => {
  const ref = useRef<ComponentRef<typeof View>>(null)
  const [isNear, setIsNear] = useState(!enabled)

  useEffect(() => {
    if (!enabled || isNear) return

    const node: unknown = ref.current
    if (typeof IntersectionObserver === 'undefined' || !(node instanceof Element)) {
      setIsNear(true)
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return
        setIsNear(true)
        observer.disconnect()
      },
      // scrollMargin extends the clipping of scroll containers (sliders);
      // browsers without it ignore the unknown option.
      { rootMargin: MARGIN, scrollMargin: MARGIN },
    )
    observer.observe(node)

    return () => observer.disconnect()
  }, [enabled, isNear])

  return { isNear, ref }
}
