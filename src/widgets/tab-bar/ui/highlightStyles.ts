import { RADIUSES } from 'shared/ui/theme'
import { WIDE_TAB_LABEL_SIZE } from '../lib/getIslandStyle'

// Active-highlight and wide-layout styles shared by the capsule element, the
// slots and the tab buttons. Kept out of the main tab-bar stylesheet so each
// module stays within the file-size budget.
export const highlightStyles = {
  // Tint layer shared by the traveling capsule and the collapsed search circle;
  // callers own its geometry so it can span a slot or fill the circle.
  capsule: {
    borderRadius: RADIUSES.round,
    position: 'absolute' as const,
  },
  // The traveling capsule fills the island content box top-to-bottom and is
  // moved horizontally by its animated translateX, so left stays at 0.
  travelCapsule: {
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    top: 0,
  },
  // Wide has no stacked label to make room for, so the icon keeps an explicit
  // zero lift. Dropping the animated style instead would freeze the compact -8
  // from the first frame and pin the magnifier to the slot top (Issue #152).
  wideIconCentered: { transform: [{ translateY: 0 }] },
  // Wide tabs are text-only: the label becomes the item's only centred child,
  // growing to the wider pill size (Apple Music top bar).
  wideLabel: {
    fontSize: WIDE_TAB_LABEL_SIZE,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
}
