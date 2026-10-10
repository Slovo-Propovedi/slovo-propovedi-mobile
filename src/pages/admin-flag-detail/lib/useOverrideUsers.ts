import { useCallback, useEffect, useMemo, useState } from 'react'
import { type APITypes, usersApi } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { usePaginatedList } from 'shared/lib/hooks/usePaginatedList'

export interface OverrideUsersState {
  isError: boolean
  isLoading: boolean
  isLoadingMore: boolean
  loadMore: () => Promise<void>
  loadMoreFailed: boolean
  onSearchChange: (search: string) => void
  search: string
  userById: Map<string, APITypes.UserResponse>
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
 * Пагинированный список пользователей для блока исключений фича-флага
 * (`GET /users?page&limit=20`). Повторяет подход списка пользователей админки
 * (клиентский поиск с дебаунсом 300мс по загруженным страницам), но живёт в
 * своём срезе — FSD запрещает кросс-импорты между срезами слоя pages.
 */
export const useOverrideUsers = (): OverrideUsersState => {
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

  const { isError, isLoading, isLoadingMore, items, loadMore, loadMoreFailed } = usePaginatedList({
    errorMessage: LOAD_ERROR_MESSAGE,
    fetchPage,
    pageSize: PAGE_SIZE,
  })

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (term === '') return items

    return items.filter(user => matchesSearch(user, term))
  }, [query, items])

  const userById = useMemo(() => new Map(items.map(user => [user.id, user])), [items])

  return {
    isError,
    isLoading,
    isLoadingMore,
    loadMore,
    loadMoreFailed,
    onSearchChange: setSearch,
    search,
    userById,
    users: filtered,
  }
}
