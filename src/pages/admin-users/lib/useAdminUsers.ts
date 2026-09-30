import { useCallback, useEffect, useMemo, useState } from 'react'
import { type APITypes, usersApi } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { reportError } from 'shared/model/error-dialog'

export interface AdminUsersState {
  hasMore: boolean
  isError: boolean
  isLoading: boolean
  isLoadingMore: boolean
  loadMore: () => Promise<void>
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
 * «загрузить ещё» и клиентским поиском с дебаунсом 300мс. У эндпоинта нет
 * серверного `search`, поэтому фильтр применяется к уже загруженным страницам.
 */
export const useAdminUsers = (): AdminUsersState => {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<APITypes.UserResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isError, setIsError] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const debouncedSetQuery = useDebounce(setQuery, SEARCH_DEBOUNCE_MS, [])

  useEffect(() => {
    debouncedSetQuery(search)
  }, [search, debouncedSetQuery])

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setIsLoading(true)
      setIsError(false)
      try {
        const response = await usersApi.getUsers().usersControllerFindAll({
          limit: PAGE_SIZE,
          page: 1,
        })
        if (!isActive) return
        setUsers(response.users)
        setHasMore(response.users.length === PAGE_SIZE)
      } catch (error) {
        if (!isActive) return
        setIsError(true)
        reportError(error, LOAD_ERROR_MESSAGE)
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const nextPage = Math.floor(users.length / PAGE_SIZE) + 1
      const response = await usersApi.getUsers().usersControllerFindAll({
        limit: PAGE_SIZE,
        page: nextPage,
      })
      setUsers(current => [...current, ...response.users])
      setHasMore(response.users.length === PAGE_SIZE)
    } catch (error) {
      reportError(error, LOAD_ERROR_MESSAGE)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoading, isLoadingMore, users.length])

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
    onSearchChange: setSearch,
    search,
    users: filtered,
  }
}
