import { RADIUSES } from 'shared/ui/theme'

// Row-layer host of the detached search button (the button lives outside the
// island's clipping content so it can leave its bounds). zIndex 20 keeps it
// above the island and below the mini pill's later subtree.
export const searchButtonStyles = {
  capsule: {
    bottom: 4,
    left: 4,
    position: 'absolute' as const,
    right: 4,
    top: 4,
  },
  column: {
    position: 'relative' as const,
    width: '100%' as const,
  },
  content: {
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    top: 0,
  },
  glass: {
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    top: 0,
  },
  host: {
    borderRadius: RADIUSES.round,
    position: 'absolute' as const,
    zIndex: 20,
  },
  // The circle is positioned natively: this layer centres the same content
  // column the islands row is centred in, independently of the live window.
  layer: {
    alignItems: 'center' as const,
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    zIndex: 20,
  },
}
