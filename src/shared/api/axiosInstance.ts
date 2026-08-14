import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { type AxiosRequestConfig } from 'axios'
import { DEFAULT_API_URL } from '../config/config'
import { ctx } from '../lib/reatom-ctx/ctx'
import { reportServerReachable, reportServerUnreachable } from '../model/network'
import { getAuth } from './generated/auth/auth'

export const ACCESS_TOKEN_KEY = '@access_token'
export const REFRESH_TOKEN_KEY = '@refresh_token'

// Dynamic base URL: initialized with DEFAULT_API_URL, updated by
// entities/settings actions (setServerUrlAction, initServerUrlAction)
// whenever the user changes or restores the server URL.
export const axiosInstance = axios.create({
  baseURL: DEFAULT_API_URL,
})

// Циклический импорт (axiosInstance ⇄ generated/auth/auth) безопасен:
// getAuth() создаёт только замыкания на customInstance, которые вызываются
// в рантайме после полной инициализации модуля (ES live bindings).
const { authControllerRefresh } = getAuth()

// Функция для refresh токена
const performTokenRefresh = async () => {
  const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY)
  if (!storedRefreshToken) throw new Error('No refresh token available')

  const { accessToken, refreshToken: newRefreshToken } = await authControllerRefresh({
    refreshToken: storedRefreshToken,
  })

  await tokenStorage.setTokens(accessToken, newRefreshToken)

  return accessToken
}

// Request interceptor для добавления токенов
axiosInstance.interceptors.request.use(async config => {
  // Refresh-запрос аутентифицируется refresh-токеном из тела,
  // поэтому Authorization с просроченным access-токеном ему не нужен
  const isRefreshRequest = config.url?.includes('/auth/refresh')
  if (isRefreshRequest) return config

  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`

  return config
})

// Response interceptor для обработки ошибок, refresh токена и мониторинга статуса сервера
axiosInstance.interceptors.response.use(
  response => {
    // Сервер ответил успешно — отмечаем его как доступный
    reportServerReachable(ctx)

    return response
  },
  async error => {
    // Сетевая ошибка (сервер не ответил) — отмечаем как недоступный
    if (!error.response) reportServerUnreachable(ctx)

    const originalRequest = error.config
    const isRefreshRequest = Boolean(originalRequest.url?.includes('/auth/refresh'))

    // Если ошибка 401 и это не запрос на refresh
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true

      try {
        // Пытаемся обновить токен
        const newToken = await performTokenRefresh()

        // Повторяем оригинальный запрос с новым токеном
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Если не удалось обновить токен - очищаем хранилище
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY])

        // TODO: Здесь можно вызвать действие для перехода на экран логина
        // Например: navigationRef.navigate('Login')

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// Функция-обертка для mutator (Orval ожидает именно такой формат)
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> =>
  axiosInstance({
    ...config,
    ...options,
  }).then(({ data }) => data)

// Функции для работы с токенами
export const tokenStorage = {
  clearTokens: async () => {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY])
  },

  getAccessToken: async () => AsyncStorage.getItem(ACCESS_TOKEN_KEY),

  setTokens: async (accessToken: string, refreshToken: string) => {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
}
