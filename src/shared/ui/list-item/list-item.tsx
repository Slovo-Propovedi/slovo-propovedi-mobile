import { Image, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { match } from 'ts-pattern'
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from '../../config/screen-dimensions'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES, useTheme } from '../themed'
import { ListItemSize } from './list-item.types'

type ListItemComponent = <T extends { artwork: string; title: string }>(
  props: ListItemProps<T>,
) => null | React.JSX.Element

interface ListItemProps<T> {
  data: T
  size?: ListItemSize
  style?: StyleProp<ViewStyle>
  testID?: string
}

export const ListItem: ListItemComponent = ({
  data: { artwork, title },
  size = ListItemSize.Small,
  style,
  testID,
}) => {
  const { currentTheme } = useTheme()
  return (
    <View testID={testID} style={[styles.component, style]}>
      <View
        testID='preview-or-counter'
        style={[
          styles.previewContainer,
          match(size)
            .with(ListItemSize.Middle, () => styles.previewMiddle)
            .with(ListItemSize.Small, () => styles.previewSmall)
            .exhaustive(),
        ]}
      >
        <Image testID='preview' style={styles.preview} source={{ uri: artwork }} />
      </View>
      <View style={styles.textsContainer}>
        <Text testID='title' style={[styles.listItemTitle, { color: currentTheme.text }]}>
          {title}
        </Text>
      </View>
    </View>
  )
}

const previewMiddleSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.25

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
  previewMiddle: { height: previewMiddleSize, width: previewMiddleSize },
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
