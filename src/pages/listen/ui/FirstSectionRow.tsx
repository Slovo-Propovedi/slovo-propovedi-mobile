import { type ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { INDENTS } from 'shared/ui/theme'

interface FirstSectionRowProps {
  button: ReactElement
  section: ReactElement
  sectionMinWidth?: number
  stacked?: boolean
}

export const FirstSectionRow = ({
  button,
  section,
  sectionMinWidth,
  stacked,
}: FirstSectionRowProps) => {
  // В stacked-режиме секция идёт на всю ширину под кнопкой — без фиксированной ширины
  // и без flex: 1 (иначе в колонке flex: 1 занял бы вертикальное место).
  // В row-режиме секция гарантирует минимум одну полную карточку (minWidth), но растёт
  // в свободное место (flex: 1) на широких экранах; без sectionMinWidth (EmptyState) — только flex: 1.
  const sectionColumnStyle = [
    stacked ? null : styles.sectionColumnFlex,
    stacked || !sectionMinWidth ? null : { minWidth: sectionMinWidth },
  ]
  const sectionNode = <View style={sectionColumnStyle}>{section}</View>

  // В stacked-режиме кнопка — самый верх строки, секция — под ней.
  return (
    <View style={[styles.row, stacked ? styles.rowStacked : null]}>
      {stacked ? button : sectionNode}
      {stacked ? sectionNode : button}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: INDENTS.medium,
    paddingHorizontal: INDENTS.medium,
  },
  rowStacked: {
    flexDirection: 'column',
  },
  sectionColumnFlex: {
    flex: 1,
  },
})
