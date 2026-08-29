/**
 * Воспроизводит аудио, игнорируя ошибку AppState (activity is no longer available).
 * @param play - Функция воспроизведения.
 */
export const playSafely = async (play: () => Promise<void>) => {
  try {
    await play()
  } catch (error) {
    if (error instanceof Error && error.message.includes('activity is no longer available'))
      console.warn('[Player] Ignoring AppState-related error:', error.message)
    else throw error
  }
}
