import { type Ctx } from '@reatom/framework'
import { secureTokenStorage } from '../api/secureTokenStorage'
import { markSessionExpired } from './sessionExpiry'

/**
 * Токены выданы конкретным сервером: при смене адреса API их нельзя отправлять
 * на новый хост (иначе файл бэкапа или опечатка в адресе уводят сессию
 * администратора на чужой сервер). Чистит токены и кешированный профиль; если
 * сессия была, поднимает сигнал истечения — entities/auth сбрасывает состояние.
 * @param ctx - Reatom-контекст экшена.
 */
export const resetSessionForServerChange = async (ctx: Ctx): Promise<void> => {
  const [accessToken, refreshToken] = await Promise.all([
    secureTokenStorage.getAccessToken(),
    secureTokenStorage.getRefreshToken(),
  ])

  await secureTokenStorage.clearTokens()
  await secureTokenStorage.clearCachedUser()

  if (accessToken || refreshToken) markSessionExpired(ctx)
}
