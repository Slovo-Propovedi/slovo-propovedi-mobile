import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { formStyles } from 'shared/ui/form/formStyles'
import { PressableButton } from 'shared/ui/pressable-button'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'

// Инстансы, проверенные вручную 2026-10-05: первый — дефолтный, второй запасной
// на случай, если первый лёг или закрылся от запросов.
const PRESET_INSTANCES = ['https://inv.phobos.observer', 'https://invidious.f5.si'] as const

const INSTANCE_LABEL = 'Инстанс Invidious'
const INSTANCE_HINT = 'Публичный инстанс Invidious или свой в локальной сети.'

/**
 * Адрес инстанса Invidious: два проверенных пресета-чипса и поле для своего
 * адреса (в т.ч. Без https — инстанс в локальной сети). Пресет применяется сразу
 * по нажатию, свой адрес — по blur поля.
 * @param props - Пропсы поля инстанса.
 * @param props.invidiousBaseUrl - Сохранённый адрес инстанса.
 * @param props.onChange - Вызывается с новым адресом инстанса.
 */
export const ImportInstanceField = ({
  invidiousBaseUrl,
  onChange,
}: {
  invidiousBaseUrl: string
  onChange: (invidiousBaseUrl: string) => void
}) => {
  const { currentTheme } = useTheme()
  const [draft, setDraft] = useState<null | string>(null)
  const value = draft ?? invidiousBaseUrl

  const commit = () => {
    const trimmed = value.trim()
    setDraft(null)
    if (trimmed && trimmed !== invidiousBaseUrl) onChange(trimmed)
  }

  return (
    <View>
      <View style={styles.presetsRow}>
        {PRESET_INSTANCES.map(preset => {
          const isSelected = preset === invidiousBaseUrl

          return (
            <PressableButton
              key={preset}
              onPress={() => onChange(preset)}
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
        placeholder={PRESET_INSTANCES[0]}
        accessibilityLabel={INSTANCE_LABEL}
        placeholderTextColor={currentTheme.placeholder}
        style={[formStyles.input, { color: currentTheme.text }]}
      />
      <Text style={[formStyles.hint, { color: currentTheme.textMuted }]}>{INSTANCE_HINT}</Text>
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
