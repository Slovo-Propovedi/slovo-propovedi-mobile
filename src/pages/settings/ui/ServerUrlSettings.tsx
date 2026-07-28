import { useAction, useAtom } from '@reatom/npm-react'
import React, { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { serverUrlAtom, setServerUrlAction } from 'entities/settings'
import { DEFAULT_API_URL } from 'shared/config'
import { COLORS, FONT_SIZES, INDENTS, useTheme } from 'shared/ui/themed'
import { TouchableItem } from 'shared/ui/touchable-item'

const isValidUrl = (url: string) => /^https?:\/\/.+/.test(url)

export const ServerUrlSettings = () => {
  const [currentUrl] = useAtom(serverUrlAtom)
  const [inputValue, setInputValue] = useState(currentUrl)
  const [saved, setSaved] = useState(false)
  const setServerUrl = useAction(setServerUrlAction)
  const { currentTheme } = useTheme()

  const handleSave = () => {
    const trimmed = inputValue.trim()
    if (!isValidUrl(trimmed)) return
    void setServerUrl(trimmed).then(() => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const handleReset = () => {
    setInputValue(DEFAULT_API_URL)
    void setServerUrl(DEFAULT_API_URL)
  }

  const isDefault = currentUrl === DEFAULT_API_URL
  const isDirty = inputValue.trim() !== currentUrl

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.label, { color: currentTheme.text }]}>URL сервера API</Text>
      <Text style={[styles.current, { color: currentTheme.textMuted }]}>Текущий: {currentUrl}</Text>
      <TextInput
        value={inputValue}
        keyboardType='url'
        autoCorrect={false}
        autoCapitalize='none'
        testID='server-url-input'
        onChangeText={setInputValue}
        placeholder='https://api.example.com'
        placeholderTextColor={currentTheme.textMuted}
        style={[
          styles.input,
          {
            borderColor: currentTheme.textMuted,
            color: currentTheme.text,
          },
        ]}
      />
      <View style={styles.buttons}>
        <TouchableItem
          onPress={handleSave}
          testID='save-server-url'
          style={[
            styles.button,
            styles.saveButton,
            { opacity: isDirty && isValidUrl(inputValue.trim()) ? 1 : 0.5 },
          ]}
        >
          <Text style={styles.buttonText}>{saved ? 'Сохранено!' : 'Сохранить'}</Text>
        </TouchableItem>
      </View>
      <TouchableItem
        disabled={isDefault}
        onPress={handleReset}
        testID='reset-server-url-link'
        style={{ opacity: isDefault ? 0.4 : 1 }}
      >
        <Text style={[styles.resetLink, { color: currentTheme.primary }]}>
          Сбросить к значению по умолчанию
        </Text>
      </TouchableItem>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.middle,
  },
  buttons: {
    flexDirection: 'row',
    gap: INDENTS.low,
    marginTop: INDENTS.medium,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  container: {
    borderBottomColor: COLORS.disabled,
    borderBottomWidth: 1,
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.high,
  },
  current: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.low,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: FONT_SIZES.base,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  label: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginBottom: INDENTS.low,
  },
  resetLink: {
    alignSelf: 'flex-start',
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.medium,
    textDecorationLine: 'underline',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
})
