import { memo, type ReactNode } from 'react'
import { type StyleProp, Text, View, type ViewStyle } from 'react-native'
import { MovingText } from 'shared/ui'
import { PressableButton } from 'shared/ui/pressable-button'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { ListItemArtwork } from './ListItemArtwork'
import { ListItemDragHandle } from './ListItemDragHandle'
import { createListItemBaseStyles } from './styles'
import { type ListItemVariant } from './types'

const DEFAULT_DRAG_LABEL = 'Переместить'

const ListItemBaseComponent = ({
  artwork,
  badges,
  drag,
  dragLabel = DEFAULT_DRAG_LABEL,
  isActive = false,
  movingTitle = false,
  onPress,
  right,
  style,
  subtitle,
  title,
  variant = 'card',
}: {
  artwork?: null | string
  badges?: ReactNode
  drag?: () => void
  dragLabel?: string
  isActive?: boolean
  movingTitle?: boolean
  onPress: () => void
  right?: ReactNode
  style?: StyleProp<ViewStyle>
  subtitle?: string
  title: string
  variant?: ListItemVariant
}) => {
  const { currentTheme } = useTheme()
  const styles = createListItemBaseStyles(currentTheme)
  const isSurface = variant === 'surface'
  const titleStyle = isSurface ? styles.surfaceTitle : styles.cardTitle
  const subtitleStyle = isSurface ? styles.surfaceSubtitle : styles.cardSubtitle

  const content = (
    <View style={isSurface ? styles.body : styles.cardBody}>
      <View style={styles.header}>
        {artwork == null ? null : <ListItemArtwork uri={artwork} variant={variant} />}
        <View style={styles.texts}>
          {movingTitle ? (
            <MovingText text={title} style={titleStyle} />
          ) : (
            <Text style={titleStyle}>{title}</Text>
          )}
          {subtitle ? (
            <Text numberOfLines={1} style={subtitleStyle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {badges}
    </View>
  )

  const dragHandle = drag ? <ListItemDragHandle onDrag={drag} label={dragLabel} /> : null
  const containerStyle: StyleProp<ViewStyle> = [
    isSurface ? styles.surface : styles.card,
    isSurface && isActive ? { borderColor: currentTheme.primary, opacity: 0.9 } : null,
    style,
  ]

  if (isSurface)
    return (
      <TouchableItem onPress={onPress} style={containerStyle}>
        {content}
        {right}
        {dragHandle}
      </TouchableItem>
    )

  return (
    <PressableButton onPress={onPress} style={containerStyle}>
      {content}
      {right}
      {dragHandle}
    </PressableButton>
  )
}

export const ListItemBase = memo(ListItemBaseComponent)
ListItemBase.displayName = 'ListItemBase'
