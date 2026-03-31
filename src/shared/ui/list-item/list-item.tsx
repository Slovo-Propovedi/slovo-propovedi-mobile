import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from 'shared/config'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'
import type { StyleProp, ViewStyle } from 'react-native'
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
}) => (
  <View testID={testID} style={[styles.component, style]}>
    <View
      testID='preview-or-counter'
      style={[
        styles.previewOrCounter,
        {
          [ListItemSize.Middle]: styles.previewOrCounterMiddle,
          [ListItemSize.Small]: styles.previewOrCounterSmall,
        }[size],
      ]}
    >
      <Image testID='preview' style={styles.preview} source={{ uri: artwork }} />
    </View>
    <View style={styles.textsContainer}>
      <Text testID='title' style={styles.listItemTitle}>
        {title}
      </Text>
    </View>
  </View>
)

const previewOrCounterSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.25

const styles = StyleSheet.create({
  component: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 'auto',
    justifyContent: 'center',
    minHeight: 60,
  },
  listItemTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h2,
  },
  preview: {
    borderRadius: RADIUSES.low,
    height: '100%',
  },
  previewOrCounter: {
    borderRadius: RADIUSES.low,
    marginVertical: INDENTS.middle,
  },
  previewOrCounterMiddle: {
    height: previewOrCounterSize,
    width: previewOrCounterSize,
  },
  previewOrCounterSmall: {
    height: 40,
    width: 40,
  },
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
