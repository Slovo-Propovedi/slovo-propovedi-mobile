import React from 'react'
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'
import { ListItem } from './list-item/list-item'
import { type ListItemSize } from './list-item/list-item.types'
import { TouchableItem } from './touchable-item'

export type OnPressTouchableListItem<T> = (data: T, event: GestureResponderEvent) => void

type TouchableListItemComponent = <T extends { artwork: string; title: string }>(
  props: TouchableListItemProps<T>,
) => React.JSX.Element

interface TouchableListItemProps<T> {
  data: T
  onPress: OnPressTouchableListItem<T>
  size?: ListItemSize
  style?: StyleProp<ViewStyle>
}

export const TouchableListItem: TouchableListItemComponent = ({ data, onPress, size, style }) => (
  <TouchableItem testID='container' onPress={event => onPress(data, event)}>
    <ListItem data={data} size={size} style={style} testID='list-item' />
  </TouchableItem>
)
