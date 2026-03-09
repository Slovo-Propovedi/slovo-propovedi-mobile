import React from 'react'
import { StyleSheet, Text } from 'react-native'
import { FONT_SIZES, INDENTS } from 'shared/themed'
import { TouchableItem } from 'shared/ui/touchable-item'
import type { TouchableItemProps } from 'shared/ui/touchable-item'

type TouchableTextItemProps = { title: string } & Omit<TouchableItemProps, 'children'>

export const TouchableTextItem = ({ disabled, onPress, style, title }: TouchableTextItemProps) => (
  <TouchableItem onPress={onPress} disabled={disabled} style={[style, styles.component]}>
    <Text style={styles.text}>{title}</Text>
  </TouchableItem>
)

const styles = StyleSheet.create({
  component: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 50,
    padding: INDENTS.high,
  },
  text: {
    fontSize: FONT_SIZES.h3,
  },
})
