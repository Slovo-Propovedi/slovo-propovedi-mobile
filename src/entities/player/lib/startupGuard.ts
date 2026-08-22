import AsyncStorage from '@react-native-async-storage/async-storage'
import { PLAYER_STARTUP_ATTEMPTS } from 'shared/config'

export const MAX_STARTUP_ATTEMPTS = 3
export const STARTUP_GUARD_RESET_DELAY_MS = 30_000

export const shouldSkipRestore = (attempts: number): boolean => attempts >= MAX_STARTUP_ATTEMPTS

export const parseStartupAttempts = (raw: null | string): number => {
  if (raw === null) return 0
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
}

export const readStartupAttempts = async (): Promise<number> => {
  const raw = await AsyncStorage.getItem(PLAYER_STARTUP_ATTEMPTS)
  return parseStartupAttempts(raw)
}

export const writeStartupAttempts = async (attempts: number): Promise<void> => {
  await AsyncStorage.setItem(PLAYER_STARTUP_ATTEMPTS, String(attempts))
}

export const resetStartupAttempts = async (): Promise<void> => {
  await writeStartupAttempts(0)
}

let resetTimer: null | ReturnType<typeof setTimeout> = null

export const scheduleStartupGuardReset = (): void => {
  if (resetTimer !== null) return
  resetTimer = setTimeout(() => {
    resetTimer = null
    void resetStartupAttempts().catch(error => {
      console.warn('[startupGuard] Failed to reset startup attempts:', error)
    })
  }, STARTUP_GUARD_RESET_DELAY_MS)
}
