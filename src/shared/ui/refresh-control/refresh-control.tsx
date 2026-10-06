import { type ColorValue, Platform, RefreshControl } from 'react-native'

/**
 * Builds a native-only pull-to-refresh control for a ScrollView/FlatList.
 *
 * On web react-native's RefreshControl is a no-op wrapper (renders a plain View
 * and never calls `onRefresh`), so the element is omitted there. A factory — not
 * a component — because Android's ScrollView clones the `refreshControl`
 * element and injects the scroll view as its children.
 * @param refreshing - Whether the spinner is visible (controlled).
 * @param onRefresh - Called on pull; may return a promise.
 * @param tintColor - Accent color for the indicator (iOS tint / Android colors).
 * @returns A `RefreshControl` element on native, `undefined` on web.
 */
export const createRefreshControl = (
  refreshing: boolean,
  onRefresh: () => Promise<void> | void,
  tintColor: ColorValue,
) =>
  Platform.OS === 'web' ? undefined : (
    <RefreshControl
      colors={[tintColor]}
      onRefresh={onRefresh}
      tintColor={tintColor}
      refreshing={refreshing}
    />
  )
