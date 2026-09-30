import { atom } from '@reatom/framework'
import { type APITypes } from 'shared/api'

export type AuthStatus = 'authenticated' | 'idle' | 'loading' | 'unauthenticated'

export const authUserAtom = atom<APITypes.UserResponse | null>(null, 'authUserAtom')

export const authStatusAtom = atom<AuthStatus>('idle', 'authStatusAtom')

export const ADMIN_ACCESS_DENIED_MESSAGE = 'Нет доступа к интерфейсу администратора'

// Пользователи с ролью admin/moderator допускаются в интерфейс администратора.
export const canAccessAdmin = (user: APITypes.UserResponse | null) =>
  user?.role === 'admin' || user?.role === 'moderator'

// Управление пользователями доступно только роли admin.
export const isAdminUser = (user: APITypes.UserResponse | null) => user?.role === 'admin'
