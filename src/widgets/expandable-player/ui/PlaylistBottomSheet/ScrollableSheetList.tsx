import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import type { BottomSheetFlatListProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'

// gorhom 5.2.14's BottomSheetFlatListProps type omits `onScroll`, but the
// runtime implementation destructures it and wires it into the scroll handler
// (verified in createBottomSheetScrollableComponent). Re-add it type-safely.
type ScrollableSheetListProps<T> = BottomSheetFlatListProps<T> & {
  onScroll?: (event: { nativeEvent: { contentOffset: { y: number } } }) => void
}

export const ScrollableSheetList = <T,>(props: ScrollableSheetListProps<T>) => (
  <BottomSheetFlatList {...props} />
)
