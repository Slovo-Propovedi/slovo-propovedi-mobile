import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { match } from 'ts-pattern'
import { CoverImage } from '../cover-image/cover-image'
import { useLayoutBaseWidth } from '../layout/lib/useLayoutBaseWidth'
import { COLORS } from '../theme/colors'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { FONT_SIZES, INDENTS, RADIUSES } from '../theme/themed'
import { ListItemSize } from './list-item.types'

type ListItemComponent = <T extends { artwork: null | string; title: string }>(
  props: ListItemProps<T>,
) => null | React.JSX.Element

interface ListItemProps<T> {
  data: T
  size?: ListItemSize
  style?: StyleProp<ViewStyle>
  testID?: string
}

const PREVIEW_MIDDLE_SIZE_RATIO = 0.25

export const ListItem: ListItemComponent = ({
  data: { artwork, title },
  size = ListItemSize.Small,
  style,
  testID,
}) => {
  const { currentTheme } = useTheme()
  // Live base from the shared layout channel: a real resize re-renders the row
  // and updates the preview instead of freezing the launch size.
  const previewMiddleSize = useLayoutBaseWidth() * PREVIEW_MIDDLE_SIZE_RATIO

  return (
    <View testID={testID} style={[styles.component, style]}>
      <View
        testID='preview-or-counter'
        style={[
          styles.previewContainer,
          match(size)
            .with(ListItemSize.Middle, () => ({
              height: previewMiddleSize,
              width: previewMiddleSize,
            }))
            .with(ListItemSize.Small, () => styles.previewSmall)
            .exhaustive(),
        ]}
      >
        <CoverImage uri={artwork} testID='preview' style={styles.preview} />
      </View>
      <View style={styles.textsContainer}>
        <Text testID='title' style={[styles.listItemTitle, { color: currentTheme.text }]}>
          {title}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  component: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 'auto',
    justifyContent: 'center',
    minHeight: 60,
  },
  listItemTitle: { fontSize: FONT_SIZES.h2 },
  preview: { borderRadius: RADIUSES.low, height: '100%' },
  previewContainer: { borderRadius: RADIUSES.low, marginVertical: INDENTS.middle },
  previewSmall: { height: 40, width: 40 },
  textsContainer: {
    borderBottomColor: COLORS.disabled,
    borderBottomWidth: 1,
    flex: 1,
    height: '100%',
    marginLeft: INDENTS.high,
    paddingRight: INDENTS.high,
    paddingVertical: INDENTS.high,
  },
})
