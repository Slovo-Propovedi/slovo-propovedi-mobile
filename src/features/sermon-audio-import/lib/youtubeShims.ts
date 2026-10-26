import * as Crypto from 'expo-crypto'

// youtubei.js рассчитан на браузер/Node: для генерации visitor id ему нужны
// `crypto.getRandomValues`/`randomUUID`, которых в Hermes нет. Собственный
// `eval` намеренно НЕ ставится: сессия создаётся без плеера
// (`retrieve_player: false`), и дефолтный `eval` RN-платформы youtubei.js
// бросает ошибку — код с youtube.com в приложении не исполняется никогда.

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
 * Ставит крипто-шимы на `globalThis.crypto`, не трогая функции, которые хост
 * уже предоставляет. Идемпотентна.
 */
export const installCryptoShims = (): void => {
  const crypto = readCrypto()
  defineIfMissing(crypto, 'getRandomValues', (array: Uint8Array) => Crypto.getRandomValues(array))
  defineIfMissing(crypto, 'randomUUID', () => Crypto.randomUUID())
}
