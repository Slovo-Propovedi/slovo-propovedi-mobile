import { Ionicons } from '@expo/vector-icons'
import { setStringAsync } from 'expo-clipboard'
import { useState } from 'react'
import { Modal, Platform, StyleSheet, Text, View } from 'react-native'
import { Button } from 'shared/ui/button'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/themed'

export interface ErrorDialogProps {
  detail: string
  message: string
  onDismiss: () => void
  visible: boolean
}

export const ErrorDialog = ({ detail, message, onDismiss, visible }: ErrorDialogProps) => {
  const [copied, setCopied] = useState(false)
  const { currentTheme } = useTheme()

  const handleCopy = async () => {
    const errorText = `
ОШИБКА: ${message}

ДЕТАЛИ:
${detail}
`.trim()

    await setStringAsync(errorText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal transparent visible={visible} animationType='fade' onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: currentTheme.surface }]}>
          <Ionicons size={48} name='warning' style={styles.icon} color={COLORS.primary} />
          <Text style={[styles.title, { color: currentTheme.text }]}>Ошибка</Text>
          <Text style={[styles.message, { color: currentTheme.text }]}>{message}</Text>
          <View style={[styles.detailContainer, { backgroundColor: currentTheme.background }]}>
            <Text style={[styles.detailTitle, { color: currentTheme.textMuted }]}>
              Детали ошибки:
            </Text>
            <Text selectable style={[styles.detailText, { color: currentTheme.text }]}>
              {detail}
            </Text>
          </View>
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
              style={[styles.button, { backgroundColor: COLORS.primary }]}
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
  title: {
    fontSize: FONT_SIZES.h1,
    fontWeight: 'bold',
    marginBottom: INDENTS.medium,
  },
})
