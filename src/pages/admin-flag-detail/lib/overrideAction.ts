import { type APITypes } from 'shared/api'

export type OverrideAction =
  { type: 'clear' } | { type: 'set'; value: APITypes.SetFeatureFlagOverrideRequestValue }

/**
 * Эффективное состояние флага для пользователя: явное исключение побеждает,
 * иначе наследуется глобальное значение флага.
 * @param overrideValue — явное исключение пользователя (`grant`/`deny`) или `null`.
 * @param globalEnabled — глобальное значение флага.
 */
export const resolveEffectiveEnabled = (
  overrideValue: APITypes.FeatureFlagOverrideValue | null,
  globalEnabled: boolean,
): boolean => {
  if (overrideValue === 'grant') return true
  if (overrideValue === 'deny') return false

  return globalEnabled
}

/**
 * Минимальное действие, переводящее пользователя в желаемое состояние при
 * известном глобальном значении флага: желаемое совпало с глобальным — снимаем
 * исключение (наследуем глобальное), иначе ставим grant/deny.
 *
 * Ноуп-переключение невозможно по построению: контрол всегда флипает значение,
 * поэтому `desired` заведомо отличается от текущего эффективного состояния.
 * Без исключения эффективное совпадает с глобальным, поэтому флип всегда даёт
 * 'set'; при наличии исключения 'clear' — это тоже настоящий флип (снятие
 * исключения отдаёт желаемое глобальное значение), а не повтор текущего.
 * @param desiredEnabled — желаемое состояние после флипа тумблера.
 * @param globalEnabled — глобальное значение флага.
 */
export const resolveOverrideAction = (
  desiredEnabled: boolean,
  globalEnabled: boolean,
): OverrideAction => {
  if (desiredEnabled === globalEnabled) return { type: 'clear' }

  return { type: 'set', value: desiredEnabled ? 'grant' : 'deny' }
}
