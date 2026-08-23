import Ionicons from '@expo/vector-icons/Ionicons'
import * as Clipboard from 'expo-clipboard'
import { useEffect, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { FONT_SIZES, RADIUSES, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import type { StyleProp, ViewStyle } from 'react-native'

const COPIED_FEEDBACK_MS = 2000

interface CopyLinkButtonProps {
  style?: StyleProp<ViewStyle>
  url: string
}

export const CopyLinkButton = ({ style, url }: CopyLinkButtonProps) => {
  const { currentTheme } = useTheme()
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) return

    const timer = setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [isCopied])

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(url)
      setIsCopied(true)
    } catch (error) {
      console.error('[share] Failed to copy release URL:', error)
    }
  }

  return (
    <TouchableItem
      onPress={() => void handleCopy()}
      style={[styles.button, { backgroundColor: currentTheme.surface }, style]}
    >
      <Ionicons
        size={24}
        style={styles.icon}
        color={currentTheme.primary}
        name={isCopied ? 'checkmark-circle-outline' : 'copy-outline'}
      />
      <Text style={[styles.title, { color: isCopied ? currentTheme.primary : currentTheme.text }]}>
        {isCopied ? 'Скопировано' : 'Скопировать ссылку'}
      </Text>
    </TouchableItem>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flexDirection: 'row',
    padding: 16,
  },
  icon: { marginRight: 12 },
  title: { fontSize: FONT_SIZES.base },
})
