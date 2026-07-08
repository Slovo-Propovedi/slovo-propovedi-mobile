import { Ionicons } from '@expo/vector-icons'
import { useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isOnlineAtom, serverUnreachableAtom } from 'shared/model'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui'

const TOAST_COLOR = '#ff9500'

export const ServerErrorToast = () => {
  const isOnline = useAtom(isOnlineAtom)[0]
  const serverUnreachable = useAtom(serverUnreachableAtom)[0]
  const insets = useSafeAreaInsets()
  const opacity = useSharedValue(0)

  const visible = isOnline && serverUnreachable

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 300 })
  }, [visible, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      pointerEvents='none'
      style={[styles.container, animatedStyle, { top: insets.top + INDENTS.medium }]}
    >
      <View style={styles.toast}>
        <Ionicons size={16} name='alert-circle' color={COLORS.white} />
        <Text style={styles.text}>Сервер недоступен</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'absolute',
    zIndex: 100,
  },
  text: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  toast: {
    alignItems: 'center',
    backgroundColor: TOAST_COLOR,
    borderRadius: RADIUSES.round,
    flexDirection: 'row',
    gap: INDENTS.low,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
})
