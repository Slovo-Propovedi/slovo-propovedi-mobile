import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { API_URL } from 'shared/config/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportServerReachable, reportServerUnreachable } from 'shared/model'
import type { AxiosRequestConfig } from 'axios'

export const ACCESS_TOKEN_KEY = '@access_token'
export const REFRESH_TOKEN_KEY = '@refresh_token'

export const axiosInstance = axios.create({
  baseURL: API_URL,
})

// Функция для refresh токена
const performTokenRefresh = async () => {
  const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY)
  if (!storedRefreshToken) throw new Error('No refresh token available')

  const response = await axios.post(`${API_URL}/auth/refresh`, {
    refreshToken: storedRefreshToken,
  })

  const { accessToken, refreshToken: newRefreshToken } = response.data

  // Сохраняем новые токены
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (newRefreshToken) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken)

  return accessToken
}

// Request interceptor для добавления токенов
axiosInstance.interceptors.request.use(async config => {
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

    // Если ошибка 401 и это не запрос на refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
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

export default axiosInstance
