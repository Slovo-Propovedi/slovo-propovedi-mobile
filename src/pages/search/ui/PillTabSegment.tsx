import { useCallback, useEffect, useRef } from 'react'
import {
  type ColorValue,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  Text,
  type ViewInstance,
  type ViewStyle,
} from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { useTheme, withAlpha } from 'shared/ui/theme'
import { styles } from './PillTabs.styles'

// Gray selection overlay on the scope track: subtle on the white track, clearly
// lighter on the pure-black one where a 10% black overlay disappears.
const SCOPE_SELECTED_ALPHA = { dark: 0.18, light: 0.1 } as const

const getScopeSelectedFill = (isLight: boolean, text: ColorValue) =>
  withAlpha(text, isLight ? SCOPE_SELECTED_ALPHA.light : SCOPE_SELECTED_ALPHA.dark)

// In results the accent fill marks the selection, so the contrast comes from
// boldness of the unselected labels instead of the selected one.
const getFontWeight = (isResults: boolean, selected: boolean) => {
  if (isResults) return selected ? '400' : '700'

  return selected ? '600' : '400'
}

export const PillTabSegment = ({
  disabled = false,
  isResults,
  label,
  onPress,
  selected,
  stretch = false,
}: {
  disabled?: boolean
  isResults: boolean
  label: string
  onPress?: () => void
  selected: boolean
  stretch?: boolean
}) => {
  const { currentTheme, isLight } = useTheme()
  const buttonRef = useRef<ViewInstance>(null)

  const segmentStyle: StyleProp<ViewStyle> = [
    isResults ? styles.resultsItem : styles.segment,
    !isResults && stretch && styles.segmentStretch,
    isResults && selected && styles.resultsItemSelected,
    selected && {
      backgroundColor: isResults
        ? currentTheme.primary
        : getScopeSelectedFill(isLight, currentTheme.text),
    },
  ]

  // TEMPORARY device diagnostics: remove after the hit-area investigation.
  useEffect(() => {
    if (!__DEV__) return

    console.debug('[pilltap] style', label, JSON.stringify(StyleSheet.flatten(segmentStyle)))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- diagnostic snapshot of the first render
  }, [])

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!__DEV__) return

      console.debug('[pilltap] layout', label, JSON.stringify(event.nativeEvent.layout))
      buttonRef.current?.measureInWindow((x, y, width, height) => {
        console.debug('[pilltap] window', label, JSON.stringify({ height, width, x, y }))
      })
    },
    [label],
  )

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (!__DEV__) return

      const { locationX, locationY, pageX, pageY } = event.nativeEvent

      console.debug(
        '[pilltap] press-in',
        label,
        JSON.stringify({ locationX, locationY, pageX, pageY }),
      )
    },
    [label],
  )

  return (
    <PressableButton
      ref={buttonRef}
      onPress={onPress}
      style={segmentStyle}
      onLayout={handleLayout}
      onPressIn={handlePressIn}
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
    >
      <Text
        style={[
          styles.label,
          isResults && styles.resultsLabel,
          {
            color: disabled
              ? currentTheme.textMuted
              : isResults && selected
                ? currentTheme.onPrimary
                : currentTheme.text,
            fontWeight: getFontWeight(isResults, selected),
          },
        ]}
      >
        {label}
      </Text>
    </PressableButton>
  )
}
