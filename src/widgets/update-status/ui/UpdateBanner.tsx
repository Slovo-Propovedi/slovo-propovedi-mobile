import { Feather } from '@expo/vector-icons'
import { useAtom } from '@reatom/npm-react'
import { Pressable, StyleSheet, Text } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { updateAvailableAtom, updateDialogVisibleAtom } from 'shared/model'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/theme'
import { UpdateDialog } from './UpdateDialog'
import { useUpdateIslandAnimation } from './useUpdateIslandAnimation'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Kept in sync with useUpdateIslandAnimation to sit below the NetworkBanner
const PILL_HEIGHT = 36

export const UpdateBanner = () => {
  const [updateAvailable] = useAtom(updateAvailableAtom)
  const [isDialogVisible, setIsDialogVisible] = useAtom(updateDialogVisibleAtom)
  const insets = useSafeAreaInsets()
  const { containerStyle, contentStyle, expand, isExpanded } =
    useUpdateIslandAnimation(updateAvailable)

  const handlePress = () => {
    if (!isExpanded) {
      expand()
      return
    }

    setIsDialogVisible(true)
  }

  if (!updateAvailable) return null

  return (
    <>
      <AnimatedPressable
        onPress={handlePress}
        testID='update-banner'
        hitSlop={isExpanded ? 0 : 16}
        style={[
          styles.container,
          { top: insets.top + INDENTS.low + PILL_HEIGHT + INDENTS.low },
          containerStyle,
        ]}
      >
        <Animated.View style={[styles.pill, contentStyle]}>
          <Feather size={16} color={COLORS.white} name='arrow-up-circle' />
          <Text style={styles.text}>Обновление</Text>
        </Animated.View>
      </AnimatedPressable>
      <UpdateDialog visible={isDialogVisible} onClose={() => setIsDialogVisible(false)} />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: COLORS.success,
    elevation: 5,
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: COLORS.black,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 101,
  },
  pill: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: INDENTS.low,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
  text: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
})
