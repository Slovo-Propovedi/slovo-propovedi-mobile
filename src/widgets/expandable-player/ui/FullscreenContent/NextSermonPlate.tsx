import { Entypo } from '@expo/vector-icons'
import { memo, useCallback, useEffect, useState } from 'react'
import { PixelRatio, Pressable, Text, View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { FONT_SIZES, INDENTS } from 'shared/ui/theme'
import type { createStyles } from '../ExpandablePlayer/styles'

interface NextSermonPlateProps {
  currentAudioId: string
  insetsTop: number
  nextSermonTitle: string
  styles: ReturnType<typeof createStyles>
}

const ANIMATION_DURATION = 220
export const AUTO_COLLAPSE_DELAY_MS = 10_000
const TITLE_LINES = 2
const TITLE_LINE_HEIGHT_FACTOR = 1.25
// Vertical spacing inside the wrapper: the title Text's marginTop (INDENTS.lowest).
const TITLE_WRAPPER_GAP = INDENTS.lowest

export const NextSermonPlate = memo(
  ({ currentAudioId, insetsTop, nextSermonTitle, styles }: NextSermonPlateProps) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isTitleMounted, setIsTitleMounted] = useState(false)
    const [prevAudioId, setPrevAudioId] = useState(currentAudioId)
    const progress = useSharedValue(0)

    // Auto-collapse when the current sermon changes (derived-state reset).
    if (prevAudioId !== currentAudioId) {
      setPrevAudioId(currentAudioId)
      setIsExpanded(false)
      setIsTitleMounted(false)
      progress.value = 0
    }

    const collapse = useCallback(() => {
      setIsExpanded(false)
      progress.value = withTiming(0, { duration: ANIMATION_DURATION }, finished => {
        if (finished) scheduleOnRN(setIsTitleMounted, false)
      })
    }, [progress])

    // Auto-collapse after AUTO_COLLAPSE_DELAY_MS of being expanded.
    useEffect(() => {
      if (!isExpanded) return
      const timer = setTimeout(collapse, AUTO_COLLAPSE_DELAY_MS)
      return () => clearTimeout(timer)
    }, [collapse, isExpanded])

    const toggleExpanded = () => {
      if (isExpanded) collapse()
      else {
        setIsExpanded(true)
        setIsTitleMounted(true)
        progress.value = withTiming(1, { duration: ANIMATION_DURATION })
      }
    }

    const fontScale = PixelRatio.getFontScale()
    const titleLineHeight = Math.ceil(FONT_SIZES.xl * TITLE_LINE_HEIGHT_FACTOR * fontScale)
    const maxTitleHeight = titleLineHeight * TITLE_LINES + TITLE_WRAPPER_GAP

    const chevronStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
    }))

    const titleStyle = useAnimatedStyle(() => ({
      maxHeight: interpolate(progress.value, [0, 1], [0, maxTitleHeight]),
      opacity: progress.value,
    }))

    const accessibilityLabel = isExpanded
      ? `Следующая проповедь. ${nextSermonTitle}`
      : 'Следующая проповедь'

    return (
      <View pointerEvents='box-none' style={[styles.nextSermonAnchor, { top: insetsTop }]}>
        <Pressable
          onPress={toggleExpanded}
          accessibilityRole='button'
          style={styles.nextSermonContainer}
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ expanded: isExpanded }}
        >
          <View style={styles.nextSermonRow}>
            <Text style={styles.nextSermonLabel}>следующая проповедь</Text>
            <Animated.View style={chevronStyle}>
              <Entypo name='chevron-down' style={styles.nextSermonChevron} />
            </Animated.View>
          </View>
          {isTitleMounted && (
            <Animated.View style={[styles.nextSermonTitleWrapper, titleStyle]}>
              <Text
                numberOfLines={2}
                style={[styles.nextSermonTitle, { lineHeight: titleLineHeight }]}
              >
                {nextSermonTitle}
              </Text>
            </Animated.View>
          )}
        </Pressable>
      </View>
    )
  },
)
