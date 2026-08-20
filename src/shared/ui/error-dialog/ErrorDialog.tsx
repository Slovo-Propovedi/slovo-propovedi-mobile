import { Ionicons } from '@expo/vector-icons'
import { setStringAsync } from 'expo-clipboard'
import { useState } from 'react'
import { Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../button'
import { COLORS } from '../theme/colors'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { FONT_SIZES, INDENTS, RADIUSES } from '../theme/themed'

const useErrorCopy = (message: string, detail: string) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    const text = `ОШИБКА: ${message}\n\nДЕТАЛИ:\n${detail}`.trim()
    await setStringAsync(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return { copied, handleCopy }
}

export interface ErrorDialogProps {
  detail: string
  message: string
  onDismiss: () => void
  visible: boolean
}

export const ErrorDialog = ({ detail, message, onDismiss, visible }: ErrorDialogProps) => {
  const { currentTheme } = useTheme()
  const { copied, handleCopy } = useErrorCopy(message, detail)

  return (
    <Modal transparent visible={visible} animationType='fade' onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: currentTheme.surface }]}>
          <Ionicons size={48} name='warning' style={styles.icon} color={currentTheme.primary} />
          <Text style={[styles.title, { color: currentTheme.text }]}>Ошибка</Text>
          <ScrollView alwaysBounceVertical style={styles.scrollContent}>
            <Text style={[styles.message, { color: currentTheme.text }]}>{message}</Text>
            <View style={[styles.detailContainer, { backgroundColor: currentTheme.background }]}>
              <Text style={[styles.detailTitle, { color: currentTheme.textMuted }]}>
                Детали ошибки:
              </Text>
              <Text selectable style={[styles.detailText, { color: currentTheme.text }]}>
                {detail}
              </Text>
            </View>
          </ScrollView>
          <View style={styles.buttonContainer}>
            <Button
              onPress={handleCopy}
              titleStyle={styles.buttonText}
              title={copied ? '✓ Скопировано' : '📋 Копировать'}
              style={[styles.button, { backgroundColor: currentTheme.textMuted }]}
            />
            <Button
              title='Закрыть'
              onPress={onDismiss}
              titleStyle={styles.buttonText}
              style={[styles.button, { backgroundColor: currentTheme.primary }]}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUSES.low,
  },
  buttonContainer: {
    flexShrink: 0,
    gap: INDENTS.low,
    width: '100%',
  },
  buttonText: {
    color: COLORS.onPrimary,
  },
  detailContainer: {
    borderRadius: RADIUSES.low,
    marginBottom: INDENTS.high,
    padding: INDENTS.medium,
    width: '100%',
  },
  detailText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: FONT_SIZES.sm,
    lineHeight: 16,
  },
  detailTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    marginBottom: INDENTS.low,
  },
  dialog: {
    alignItems: 'center',
    borderRadius: RADIUSES.high,
    maxHeight: '85%',
    overflow: 'hidden',
    padding: INDENTS.high,
    width: '100%',
  },
  icon: {
    marginBottom: INDENTS.medium,
  },
  message: {
    fontSize: FONT_SIZES.base,
    marginBottom: INDENTS.medium,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flex: 1,
    justifyContent: 'center',
    padding: INDENTS.high,
  },
  scrollContent: {
    flexShrink: 1,
    marginBottom: INDENTS.medium,
    width: '100%',
  },
  title: {
    fontSize: FONT_SIZES.h1,
    fontWeight: 'bold',
    marginBottom: INDENTS.medium,
  },
})
