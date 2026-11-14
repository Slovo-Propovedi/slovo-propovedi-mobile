import { useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { AdminSelect } from 'shared/ui'
import { formStyles } from 'shared/ui/form/formStyles'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { normalizeInvidiousBaseUrl } from '../lib/importSettings'
import { type ImportSource } from '../lib/importTypes'

const CUSTOM_OPTION_LABEL = 'Свой инстанс…'
const CUSTOM_INPUT_LABEL = 'Свой инстанс'
const CUSTOM_VALUE = 'custom'
const INVIDIOUS_PREFIX = 'invidious:'
const WEB_DISABLED_HINT = 'На вебе доступен только источник Invidious'
const YOUTUBE_VALUE = 'youtube'

const instanceLabel = (url: string) => `Invidious: ${url.replace('https://', '')}`
const invidiousValue = (url: string) => `${INVIDIOUS_PREFIX}${url}`

/**
 * Селектор источника импорта и инстанса Invidious: один компактный триггер с
 * вариантами YouTube / сохранённые инстансы / «Свой инстанс…». Свой адрес
 * вводится в поле под триггером и применяется по blur; пустой ввод игнорируется.
 * @param props - Пропсы селектора.
 * @param props.invidiousBaseUrl - Сохранённый адрес инстанса (текущий выбор).
 * @param props.instances - Прочие сохранённые инстансы с бэкенда.
 * @param props.isWeb - На web YouTube недоступен: вариант показан, но выключен.
 * @param props.onSelectInstance - Вызывается с адресом выбранного инстанса.
 * @param props.onSelectYoutube - Вызывается при выборе источника YouTube.
 * @param props.source - Сохранённый источник импорта.
 */
export const ImportSourceSelect = ({
  instances,
  invidiousBaseUrl,
  isWeb,
  onSelectInstance,
  onSelectYoutube,
  source,
}: {
  instances: readonly string[]
  invidiousBaseUrl: string
  isWeb: boolean
  onSelectInstance: (url: string) => void
  onSelectYoutube: () => void
  source: ImportSource
}) => {
  const { currentTheme } = useTheme()
  const [isCustomSelected, setIsCustomSelected] = useState(false)
  const [customDraft, setCustomDraft] = useState('')

  // На web даже сохранённый «YouTube» разрешается через Invidious.
  const usesInvidious = isWeb || source === 'invidious'
  const selectedValue = isCustomSelected
    ? CUSTOM_VALUE
    : usesInvidious
      ? invidiousValue(invidiousBaseUrl)
      : YOUTUBE_VALUE

  const options = [
    { disabled: isWeb, hint: WEB_DISABLED_HINT, label: 'YouTube', value: YOUTUBE_VALUE },
    { label: instanceLabel(invidiousBaseUrl), value: invidiousValue(invidiousBaseUrl) },
    ...instances
      .filter(url => url !== invidiousBaseUrl)
      .map(url => ({ label: instanceLabel(url), value: invidiousValue(url) })),
    { label: CUSTOM_OPTION_LABEL, value: CUSTOM_VALUE },
  ]

  const selectOption = (value: string) => {
    setIsCustomSelected(value === CUSTOM_VALUE)
    setCustomDraft('')

    if (value === CUSTOM_VALUE) return
    if (value === YOUTUBE_VALUE) {
      onSelectYoutube()
      return
    }

    if (!value.startsWith(INVIDIOUS_PREFIX)) return

    onSelectInstance(value.slice(INVIDIOUS_PREFIX.length))
  }

  const commitCustomInstance = () => {
    const normalized = normalizeInvidiousBaseUrl(customDraft)
    if (normalized === '') return

    onSelectInstance(normalized)
    setIsCustomSelected(false)
    setCustomDraft('')
  }

  return (
    <View style={styles.container}>
      <AdminSelect options={options} value={selectedValue} onChange={selectOption} />
      {isCustomSelected ? (
        <TextInput
          autoFocus
          keyboardType='url'
          value={customDraft}
          autoCapitalize='none'
          placeholder='https://…'
          onBlur={commitCustomInstance}
          onChangeText={setCustomDraft}
          accessibilityLabel={CUSTOM_INPUT_LABEL}
          placeholderTextColor={currentTheme.placeholder}
          style={[formStyles.input, { color: currentTheme.text }]}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: INDENTS.low,
  },
})
