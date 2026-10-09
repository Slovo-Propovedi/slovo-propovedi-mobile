export interface MenuViewport {
  dx: number
  dy: number
  height: number
  width: number
}

const isWebKit = () => {
  if (typeof navigator === 'undefined') return false
  const { userAgent } = navigator
  return /AppleWebKit/i.test(userAgent) && !/Chrome|Chromium|Edg|OPR|Firefox/i.test(userAgent)
}

// react-native-web's Modal is `position: fixed; inset: 0`, so the menu lives in
// the LAYOUT viewport. measureInWindow (getBoundingClientRect) and
// useWindowDimensions both report VISUAL-viewport coordinates. WebKit displaces
// the visual viewport during pinch-zoom pan and the iOS toolbar animation, so
// the two spaces disagree by exactly visualViewport.offsetLeft/offsetTop
// (WebKit bug 257375). dx/dy carry that visual->layout correction; width/height
// stay the LAYOUT viewport so clamping matches the fixed-position geometry.
// Chrome/Firefox agree on both spaces, so the correction is WebKit-only (the
// same approach floating-ui's getVisualOffsets takes).
export const getMenuViewport = (): MenuViewport => {
  if (typeof window === 'undefined') return { dx: 0, dy: 0, height: 0, width: 0 }

  const { clientHeight: height, clientWidth: width } = document.documentElement
  const visualViewport = window.visualViewport

  if (!isWebKit() || !visualViewport) return { dx: 0, dy: 0, height, width }

  return { dx: visualViewport.offsetLeft, dy: visualViewport.offsetTop, height, width }
}
