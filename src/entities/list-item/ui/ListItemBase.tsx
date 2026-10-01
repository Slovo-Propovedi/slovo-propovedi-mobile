import { memo, type ReactNode } from 'react'
import { Platform, type StyleProp, Text, View, type ViewStyle } from 'react-native'
import { MovingText } from 'shared/ui'
import { PressableButton } from 'shared/ui/pressable-button'
import { useTheme } from 'shared/ui/theme'
import { ListItemArtwork } from './ListItemArtwork'
import { ListItemDragHandle } from './ListItemDragHandle'
import { createListItemBaseStyles } from './styles'
import { type ListItemVariant } from './types'

const DEFAULT_DRAG_LABEL = 'Переместить'

// Web: a row that carries the drag-handle IconButton must not itself be a
// <button> — RNW renders accessibilityRole='button' as a real <button>, so the
// nested handle <button> is invalid DOM and React errors on it. Use the link
// role on web (renders <div role="link" tabindex=0>); rows without a handle keep
// the default button role. Same pattern as TracksListItemBase ROW_ACCESSIBILITY_ROLE.
const DRAGGABLE_ROW_ROLE = Platform.OS === 'web' ? 'link' : 'button'

const ListItemBaseComponent = ({
  artwork,
  badges,
  drag,
  dragLabel = DEFAULT_DRAG_LABEL,
  isActive = false,
  movingTitle = false,
  onLongPress,
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
  onLongPress?: () => void
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

  return (
    <PressableButton
      onPress={onPress}
      style={containerStyle}
      onLongPress={onLongPress}
      accessibilityRole={drag ? DRAGGABLE_ROW_ROLE : undefined}
    >
      {content}
      {right}
      {dragHandle}
    </PressableButton>
  )
}

export const ListItemBase = memo(ListItemBaseComponent)
ListItemBase.displayName = 'ListItemBase'
