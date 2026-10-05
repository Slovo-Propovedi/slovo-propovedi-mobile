import { useCallback, useEffect, useMemo, useState } from 'react'
import { type APITypes, usersApi } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { usePaginatedList } from 'shared/lib/hooks/usePaginatedList'

export interface AdminUsersState {
  hasMore: boolean
  isError: boolean
  isLoading: boolean
  isLoadingMore: boolean
  loadMore: () => Promise<void>
  loadMoreFailed: boolean
  onSearchChange: (search: string) => void
  search: string
  users: APITypes.UserResponse[]
}

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить пользователей'

const matchesSearch = (user: APITypes.UserResponse, term: string) =>
  user.name.toLowerCase().includes(term) ||
  user.email.toLowerCase().includes(term) ||
  user.username.toLowerCase().includes(term)

/**
 * Пагинированный список пользователей админки (`GET /users?page&limit=20`) с
 * автодозагрузкой при достижении конца и клиентским поиском с дебаунсом 300мс.
 * У эндпоинта нет серверного `search`, поэтому фильтр применяется к уже
 * загруженным страницам.
 */
export const useAdminUsers = (): AdminUsersState => {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  const debouncedSetQuery = useDebounce(setQuery, SEARCH_DEBOUNCE_MS, [])

  useEffect(() => {
    debouncedSetQuery(search)
  }, [search, debouncedSetQuery])

  const fetchPage = useCallback(
    (page: number) =>
      usersApi
        .getUsers()
        .usersControllerFindAll({ limit: PAGE_SIZE, page })
        .then(r => r.users),
    [],
  )

  const {
    hasMore,
    isError,
    isLoading,
    isLoadingMore,
    items: users,
    loadMore,
    loadMoreFailed,
  } = usePaginatedList({ errorMessage: LOAD_ERROR_MESSAGE, fetchPage, pageSize: PAGE_SIZE })

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (term === '') return users

    return users.filter(user => matchesSearch(user, term))
  }, [query, users])

  return {
    hasMore,
    isError,
    isLoading,
    isLoadingMore,
    loadMore,
    loadMoreFailed,
    onSearchChange: setSearch,
    search,
    users: filtered,
  }
}
