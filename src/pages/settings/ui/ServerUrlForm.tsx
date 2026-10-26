import { useAction, useAtom } from '@reatom/npm-react'
import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { DEFAULT_API_URL } from 'shared/config'
import { serverUrlAtom, setServerUrlAction } from 'shared/model'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './ServerUrlSettings.styles'

const INVALID_PROTOCOL_MESSAGE = 'Адрес сервера должен начинаться с https://'
const SESSION_RESET_HINT = 'При смене адреса вход администратора сбрасывается.'

// Только https: на этот адрес уходят токены администратора, plain http отдал бы
// их в открытом виде.
const isValidUrl = (url: string) => /^https:\/\/.+/.test(url)

export const ServerUrlForm = () => {
  const [currentUrl] = useAtom(serverUrlAtom)
  const [inputValue, setInputValue] = useState(currentUrl)
  const [saved, setSaved] = useState(false)
  const [validationError, setValidationError] = useState<null | string>(null)
  const setServerUrl = useAction(setServerUrlAction)
  const { currentTheme } = useTheme()

  const handleChangeText = (value: string) => {
    setInputValue(value)
    setValidationError(null)
  }

  const handleSave = () => {
    const trimmed = inputValue.trim()
    if (!isValidUrl(trimmed)) {
      setValidationError(INVALID_PROTOCOL_MESSAGE)
      return
    }

    setValidationError(null)
    void setServerUrl(trimmed).then(() => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const handleReset = () => {
    setInputValue(DEFAULT_API_URL)
    setValidationError(null)
    void setServerUrl(DEFAULT_API_URL)
  }

  const isDefault = currentUrl === DEFAULT_API_URL
  const isDirty = inputValue.trim() !== currentUrl

  return (
    <>
      <TextInput
        value={inputValue}
        keyboardType='url'
        autoCorrect={false}
        autoCapitalize='none'
        onChangeText={handleChangeText}
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
      {validationError ? (
        <Text style={styles.errorText} accessibilityRole='alert'>
          {validationError}
        </Text>
      ) : null}
      <Text style={[styles.hintText, { color: currentTheme.textMuted }]}>{SESSION_RESET_HINT}</Text>
      <View style={styles.buttons}>
        <TouchableItem
          onPress={handleSave}
          style={[
            styles.button,
            {
              backgroundColor: currentTheme.primary,
              opacity: isDirty && isValidUrl(inputValue.trim()) ? 1 : 0.5,
            },
          ]}
        >
          <Text style={styles.buttonText}>{saved ? 'Сохранено!' : 'Сохранить'}</Text>
        </TouchableItem>
      </View>
      <TouchableItem
        disabled={isDefault}
        noDisabledBackground
        onPress={handleReset}
        style={{ opacity: isDefault ? 0.4 : 1 }}
      >
        <Text style={[styles.resetLink, { color: currentTheme.primary }]}>
          Сбросить к значению по умолчанию
        </Text>
      </TouchableItem>
    </>
  )
}
