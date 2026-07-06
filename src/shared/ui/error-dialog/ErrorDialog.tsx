import { Ionicons } from '@expo/vector-icons'
import { setStringAsync } from 'expo-clipboard'
import React, { useState } from 'react'
import { Modal, Platform, StyleSheet, Text, View } from 'react-native'
import { Button } from 'shared/ui/button'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'

export interface ErrorDialogProps {
  detail: string
  message: string
  onDismiss: () => void
  visible: boolean
}

export const ErrorDialog = ({ detail, message, onDismiss, visible }: ErrorDialogProps) => {
  const [copied, setCopied] = useState(false)

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
        <View style={styles.dialog}>
          <Ionicons size={48} name='warning' style={styles.icon} color={COLORS.primary} />
          <Text style={styles.title}>Ошибка</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.detailContainer}>
            <Text style={styles.detailTitle}>Детали ошибки:</Text>
            <Text selectable style={styles.detailText}>
              {detail}
            </Text>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              onPress={handleCopy}
              titleStyle={styles.buttonText}
              style={[styles.button, styles.copyButton]}
              title={copied ? '✓ Скопировано' : '📋 Копировать'}
            />
            <Button
              title='Закрыть'
              onPress={onDismiss}
              style={styles.button}
              titleStyle={styles.buttonText}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUSES.low,
  },
  buttonContainer: {
    gap: INDENTS.low,
    width: '100%',
  },
  buttonText: {
    color: COLORS.onPrimary,
  },
  copyButton: {
    backgroundColor: COLORS.textMuted,
  },
  detailContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUSES.low,
    marginBottom: INDENTS.high,
    padding: INDENTS.medium,
    width: '100%',
  },
  detailText: {
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: FONT_SIZES.sm,
    lineHeight: 16,
  },
  detailTitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    marginBottom: INDENTS.low,
  },
  dialog: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUSES.high,
    padding: INDENTS.high,
    width: '100%',
  },
  icon: {
    marginBottom: INDENTS.medium,
  },
  message: {
    color: COLORS.text,
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
    color: COLORS.text,
    fontSize: FONT_SIZES.h1,
    fontWeight: 'bold',
    marginBottom: INDENTS.medium,
  },
})
