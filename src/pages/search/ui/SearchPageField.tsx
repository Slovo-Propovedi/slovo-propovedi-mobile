import { Ionicons } from '@expo/vector-icons'
import { useAction } from '@reatom/npm-react'
import { usePathname } from 'expo-router'
import { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import { SearchBar } from 'features/sermon-search'
import { isSearchRoutePath } from 'features/sermon-search/@x/barMorph'
import { setBarCollapsed } from 'shared/ui/layout'
import { INDENTS, MIN_TOUCH_TARGET, RADIUSES, useTheme } from 'shared/ui/theme'

const MAGNIFIER_SIZE = 20

/**
 * The page-hosted search field: the same `SearchBar` row the bottom pill used,
 * framed as a themed input at the top of the page. Focusing it expands the
 * floating bar even when a previous scroll collapsed it; scrolling afterwards
 * collapses it again, because the search route no longer suspends the driver.
 * @returns The framed field with its leading magnifier.
 */
export const SearchPageField = () => {
  const { currentTheme } = useTheme()
  const pathname = usePathname()
  const applyBarCollapsed = useAction(setBarCollapsed)
  const handleFocusChange = useCallback(
    (isFocused: boolean) => {
      if (!isFocused) return

      applyBarCollapsed(false)
    },
    [applyBarCollapsed],
  )

  return (
    <View style={[styles.field, { backgroundColor: currentTheme.card }]}>
      <Ionicons name='search' size={MAGNIFIER_SIZE} color={currentTheme.textMuted} />
      <SearchBar
        isVisible
        suggestionsPlacement='below'
        onFocusChange={handleFocusChange}
        isOpen={isSearchRoutePath(pathname)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    borderRadius: RADIUSES.middle,
    flexDirection: 'row',
    gap: INDENTS.low,
    height: MIN_TOUCH_TARGET,
    marginBottom: INDENTS.low,
    marginHorizontal: INDENTS.medium,
    paddingLeft: INDENTS.middle,
    // Its absolutely-positioned suggestions paint inside this node (zIndex 1),
    // so the field itself must outrank the sections rendered after it on web.
    zIndex: 1,
  },
})
