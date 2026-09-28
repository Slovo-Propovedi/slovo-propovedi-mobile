import { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'

// Dimmed backdrop behind the sheet: a tap on it closes the sheet
// (pressBehavior='close'). Mirrors PlaylistSheetBackdrop.
export const SoundSheetBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...props} appearsOnIndex={0} pressBehavior='close' disappearsOnIndex={-1} />
)
