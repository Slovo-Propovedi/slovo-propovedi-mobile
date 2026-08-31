import { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'

// Dimmed backdrop behind the sheet: appears once the sheet lifts off the
// closed snap, and a tap on it closes the sheet (pressBehavior='close').
export const PlaylistSheetBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...props} appearsOnIndex={0} pressBehavior='close' disappearsOnIndex={-1} />
)
