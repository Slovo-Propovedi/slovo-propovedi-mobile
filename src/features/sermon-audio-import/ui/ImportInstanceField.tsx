import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { formStyles } from 'shared/ui/form/formStyles'
import { PressableButton } from 'shared/ui/pressable-button'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { normalizeInvidiousBaseUrl } from '../lib/importSettings'

const INSTANCE_LABEL = 'Инстанс Invidious'
const INSTANCE_HINT = 'Публичный инстанс Invidious или свой в локальной сети.'
const ANTIBOT_HINT =
  'Публичные инстансы часто закрыты антиботом — надёжнее использовать свой инстанс.'

/**
 * Адрес инстанса Invidious: чипсы пресетов (приходят с бэкенда) и поле для
 * своего адреса (в т.ч. Без https — инстанс в локальной сети). Пресет
 * применяется сразу по нажатию, свой адрес — по blur поля.
 * @param props - Пропсы поля инстанса.
 * @param props.invidiousBaseUrl - Сохранённый адрес инстанса.
 * @param props.onChange - Вызывается с новым адресом инстанса.
 * @param props.presets - Адреса пресетов-чипсов (в порядке отображения).
 */
export const ImportInstanceField = ({
  invidiousBaseUrl,
  onChange,
  presets,
}: {
  invidiousBaseUrl: string
  onChange: (invidiousBaseUrl: string) => void
  presets: readonly string[]
}) => {
  const { currentTheme } = useTheme()
  const [draft, setDraft] = useState<null | string>(null)
  const value = draft ?? invidiousBaseUrl

  // Черновик в поле нельзя оставлять при выборе пресета: нажатие чипа сразу
  // меняет адрес, но позже blur поля записал бы поверх него недописанный черновик.
  const selectPreset = (preset: string) => {
    setDraft(null)
    if (preset !== invidiousBaseUrl) onChange(preset)
  }

  const commit = () => {
    const trimmed = value.trim()
    setDraft(null)
    if (trimmed === '') return

    const normalized = normalizeInvidiousBaseUrl(trimmed)
    if (normalized !== invidiousBaseUrl) onChange(normalized)
  }

  return (
    <View>
      <View style={styles.presetsRow}>
        {presets.map(preset => {
          const isSelected = preset === invidiousBaseUrl

          return (
            <PressableButton
              key={preset}
              onPress={() => selectPreset(preset)}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.preset,
                {
                  backgroundColor: isSelected ? currentTheme.primary : currentTheme.surface,
                  borderColor: isSelected ? currentTheme.primary : currentTheme.textMuted,
                },
              ]}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: isSelected ? COLORS.white : currentTheme.text },
                ]}
              >
                {preset.replace('https://', '')}
              </Text>
            </PressableButton>
          )
        })}
      </View>
      <Text style={[formStyles.fieldLabel, { color: currentTheme.text }]}>{INSTANCE_LABEL}</Text>
      <TextInput
        value={value}
        onBlur={commit}
        keyboardType='url'
        autoCapitalize='none'
        onChangeText={setDraft}
        placeholder={presets[0]}
        accessibilityLabel={INSTANCE_LABEL}
        placeholderTextColor={currentTheme.placeholder}
        style={[formStyles.input, { color: currentTheme.text }]}
      />
      <Text style={[formStyles.hint, { color: currentTheme.textMuted }]}>{INSTANCE_HINT}</Text>
      <Text style={[formStyles.hint, { color: currentTheme.textMuted }]}>{ANTIBOT_HINT}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  preset: {
    borderRadius: RADIUSES.round,
    borderWidth: 1,
    paddingHorizontal: INDENTS.middle,
    paddingVertical: INDENTS.lowest,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: INDENTS.low,
    marginBottom: INDENTS.low,
  },
  presetText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
})
