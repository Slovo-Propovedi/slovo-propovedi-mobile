import * as Crypto from 'expo-crypto'

// youtubei.js рассчитан на браузер/Node и на RN требует двух доработок:
// 1) крипто-функции для генерации visitor id (в Hermes нет crypto.getRandomValues),
// 2) собственный eval — RN-платформа по умолчанию зовёт `eval()`, который в
//    Hermes выключен, а расшифровка форматов без него не работает.
// Модуль youtubei.js здесь импортируется динамически: и сам шим, и библиотека
// грузятся только в момент импорта проповеди, а не у всех пользователей.
// Шимы ставятся один раз на процесс.

let shimsPromise: null | Promise<void> = null

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readCrypto = (): Record<string, unknown> => {
  const host: unknown = Reflect.get(globalThis, 'crypto')
  if (isRecord(host)) return host

  const fresh: Record<string, unknown> = {}
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: fresh })

  return fresh
}

const defineIfMissing = (target: Record<string, unknown>, name: string, value: unknown): void => {
  if (typeof target[name] === 'function') return
  target[name] = value
}

/**
 * Ставит крипто-шимы на `globalThis.crypto`. Отдельно от загрузки платформы
 * youtubei.js: это чистая часть, покрытая юнит-тестом — динамический import
 * библиотеки в Jest не исполняется.
 */
export const installCryptoShims = (): void => {
  const crypto = readCrypto()
  defineIfMissing(crypto, 'getRandomValues', (array: Uint8Array) => Crypto.getRandomValues(array))
  defineIfMissing(crypto, 'randomUUID', () => Crypto.randomUUID())
}

const applyShims = async (): Promise<void> => {
  installCryptoShims()

  const { Platform } = await import('youtubei.js/react-native')
  Platform.load({
    ...Platform.shim,
    eval: async data => new Function(data.output)(),
  })
}

/**
 * Ставит RN-доработки окружения для youtubei.js. Вызывается уже после того, как
 * библиотека загружена: её платформа перезаписывает `eval` при инициализации,
 * поэтому наш шим должен идти вторым. Повторные вызовы переиспользуют первый;
 * неудача не кешируется — следующий импорт попробует поставить шимы снова.
 */
export const installYoutubeShims = async (): Promise<void> => {
  shimsPromise ??= applyShims()

  try {
    await shimsPromise
  } catch (error) {
    // Неудачную установку не кешируем: иначе один сбой загрузки платформы
    // навсегда оставил бы импорт без расшифровки форматов.
    shimsPromise = null
    throw error
  }
}
