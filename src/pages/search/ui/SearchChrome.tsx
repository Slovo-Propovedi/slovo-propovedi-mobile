import { StyleSheet } from 'react-native'
import Animated, { type useAnimatedStyle } from 'react-native-reanimated'
import { ScreenTitleRow } from 'shared/ui'
import { type SearchScope, SearchScopeTabs } from './SearchScopeTabs'

// The home-only chrome above the page field. It folds away as the results pose
// settles, which lets the field slide up without ever changing its container.
export const SearchChrome = ({
  isHidden,
  isScopeClipped,
  onChange,
  scope,
  scopeStyle,
  titleStyle,
}: {
  isHidden: boolean
  isScopeClipped: boolean
  onChange: (key: string) => void
  scope: SearchScope
  scopeStyle: ReturnType<typeof useAnimatedStyle>
  titleStyle: ReturnType<typeof useAnimatedStyle>
}) => {
  if (isHidden) return null

  return (
    <>
      <Animated.View testID='search-title-block' style={[styles.clip, titleStyle]}>
        <ScreenTitleRow title='Поиск' />
      </Animated.View>
      <Animated.View
        testID='search-scope-block'
        style={[isScopeClipped ? styles.clip : styles.scopeBlock, scopeStyle]}
      >
        <SearchScopeTabs value={scope} onChange={onChange} />
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  // The scope shadow feathers below its row, so the resting home block must not
  // clip it; the fold itself clips while the shadow fades out.
  scopeBlock: {
    overflow: 'visible',
  },
})
