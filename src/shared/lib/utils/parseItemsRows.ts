const POSITIVE_INTEGER_PATTERN = /^\d+$/

/**
 * Парсит значение поля «Строк» в `null | number`.
 *
 * Пустая строка и невалидный ввод → `null` (строки не заданы). Допустимы только
 * положительные целые: `Number()` принял бы дроби ("2.5"), экспоненты ("1e3") и
 * отрицательные, поэтому ввод проверяется паттерном; "0" тоже `null` — ноль
 * строк не имеет смысла, это «не задано».
 * @param value - Сырая строка поля.
 * @returns Число строк или `null`.
 */
export const parseItemsRows = (value: string): null | number => {
  const trimmed = value.trim()
  if (trimmed === '') return null

  if (!POSITIVE_INTEGER_PATTERN.test(trimmed)) return null

  const parsed = Number(trimmed)
  return parsed > 0 ? parsed : null
}
