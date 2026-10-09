import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { getMenuViewport, type MenuViewport } from './menuViewport'

const NATIVE_VIEWPORT = { dx: 0, dy: 0 }

// While the menu is visible on web, subscribe to the events that can displace
// the visual viewport (pinch-zoom pan, iOS toolbar animation, window resize) and
// bump a tick so the caller re-measures its anchor and recomputes the menu
// position. On native nothing is subscribed and the layout viewport is taken
// straight from the window dimensions.
export const useViewportSync = ({
  height: windowHeight,
  visible,
  width: windowWidth,
}: {
  height: number
  visible: boolean
  width: number
}) => {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return

    const bump = () => setTick(current => current + 1)
    const visualViewport = window.visualViewport

    visualViewport?.addEventListener('scroll', bump, { passive: true })
    visualViewport?.addEventListener('resize', bump, { passive: true })
    window.addEventListener('resize', bump, { passive: true })

    return () => {
      visualViewport?.removeEventListener('scroll', bump)
      visualViewport?.removeEventListener('resize', bump)
      window.removeEventListener('resize', bump)
    }
  }, [visible])

  const viewport: MenuViewport =
    Platform.OS === 'web'
      ? getMenuViewport()
      : { ...NATIVE_VIEWPORT, height: windowHeight, width: windowWidth }

  return { tick, viewport }
}
