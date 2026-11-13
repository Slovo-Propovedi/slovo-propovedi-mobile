import { type ColorValue, type StyleProp, Text, type ViewStyle } from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { useTheme, withAlpha } from 'shared/ui/theme'
import { getScopeTrackFill, styles } from './PillTabs.styles'

// Gray selection overlay on the scope track: subtle on the white track, clearly
// lighter on the pure-black one where a 10% black overlay disappears.
const SCOPE_SELECTED_ALPHA = { dark: 0.18, light: 0.1 } as const

const getScopeSelectedFill = (isLight: boolean, text: ColorValue) =>
  withAlpha(text, isLight ? SCOPE_SELECTED_ALPHA.light : SCOPE_SELECTED_ALPHA.dark)

// Unselected cells paint the surface they sit on — the scope track or the page
// background. Android routes touches across a view only when it has a real
// background drawable (transparent and near-invisible alphas behave as none —
// user-verified on device), so the fill is needed for the hit area even though
// it is invisible by design: it blends with the surrounding surface.
const getUnselectedFill = (isResults: boolean, isLight: boolean, background: ColorValue) =>
  isResults ? background : getScopeTrackFill(isLight)

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

  const segmentStyle: StyleProp<ViewStyle> = [
    isResults ? styles.resultsItem : styles.segment,
    !isResults && stretch && styles.segmentStretch,
    isResults && selected && styles.resultsItemSelected,
    !selected && {
      backgroundColor: getUnselectedFill(isResults, isLight, currentTheme.background),
    },
    selected && {
      backgroundColor: isResults
        ? currentTheme.primary
        : getScopeSelectedFill(isLight, currentTheme.text),
    },
  ]

  return (
    <PressableButton
      onPress={onPress}
      // RN Pressable already sets this on its inner View; repeated explicitly so
      // the segment cell is never collapsed away from the native hit test.
      collapsable={false}
      style={segmentStyle}
      accessibilityLabel={label}
      // No `disabled` here: RN maps it to native setEnabled(false), and Android's
      // TouchTargetHelper then treats the view as BOX_NONE (only the Text child
      // stays reachable). The muted label + info dialog convey the locked state.
      accessibilityState={{ selected }}
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
