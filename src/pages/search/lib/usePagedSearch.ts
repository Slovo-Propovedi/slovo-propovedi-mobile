import { useCallback, useEffect, useRef, useState } from 'react'
import {
  collectMatchingPreachers,
  fetchPlaylistSearchPage,
  fetchSermonSearchPage,
  MIN_QUERY_LENGTH,
} from 'features/sermon-search'
import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'
import { buildFirstPageState, fetchFirstPage } from './fetchFirstPage'
import { createEmptyGroup, type GroupState, type PagedSearch } from './pagedGroup'

const DEBOUNCE_DELAY_MS = 400

export const usePagedSearch = (query: string): PagedSearch => {
  const [sermons, setSermons] = useState<GroupState<SermonData>>(createEmptyGroup)
  const [playlists, setPlaylists] = useState<GroupState<PlaylistData>>(createEmptyGroup)
  const requestIdRef = useRef(0)
  const activeQueryRef = useRef('')
  const cursorRef = useRef<null | string>(null)
  const playlistPageRef = useRef(0)
  const isLoadingMoreRef = useRef(false)
  const trimmedQuery = query.trim()
  const isActive = trimmedQuery.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    const requestId = ++requestIdRef.current
    activeQueryRef.current = isActive ? trimmedQuery : ''
    cursorRef.current = null
    playlistPageRef.current = 0
    isLoadingMoreRef.current = false

    // Deferred: a synchronous setState inside an effect cascades renders.
    const prepareTimer = setTimeout(() => {
      if (!isActive) {
        setSermons(createEmptyGroup())
        setPlaylists(createEmptyGroup())
        return
      }

      setSermons(() => ({ ...createEmptyGroup(), isLoading: true }))
      setPlaylists(() => ({ ...createEmptyGroup(), isLoading: true }))
    }, 0)

    if (!isActive) return () => clearTimeout(prepareTimer)

    const timer = setTimeout(() => {
      void (async () => {
        const pages = await fetchFirstPage(trimmedQuery)
        if (requestIdRef.current !== requestId) return

        cursorRef.current = pages.sermonPage.nextCursor
        playlistPageRef.current = 1
        const firstPage = buildFirstPageState(pages)
        setSermons(firstPage.sermons)
        setPlaylists(firstPage.playlists)
      })()
    }, DEBOUNCE_DELAY_MS)

    return () => {
      clearTimeout(prepareTimer)
      clearTimeout(timer)
    }
  }, [isActive, trimmedQuery])

  const loadMoreSermons = useCallback(async () => {
    const activeQuery = activeQueryRef.current
    const cursor = cursorRef.current
    if (!activeQuery || cursor === null || isLoadingMoreRef.current) return

    isLoadingMoreRef.current = true
    const requestId = requestIdRef.current
    setSermons(state => ({ ...state, isLoadingMore: true }))

    const page = await fetchSermonSearchPage(activeQuery, cursor)
    isLoadingMoreRef.current = false
    if (requestIdRef.current !== requestId) return

    cursorRef.current = page.nextCursor
    setSermons(state => ({
      hasMore: page.nextCursor !== null,
      isLoading: false,
      isLoadingMore: false,
      items: [...state.items, ...page.sermons],
    }))
  }, [])

  const loadMorePlaylists = useCallback(async () => {
    const activeQuery = activeQueryRef.current
    if (!activeQuery || !playlists.hasMore || isLoadingMoreRef.current) return

    isLoadingMoreRef.current = true
    const requestId = requestIdRef.current
    const nextPage = playlistPageRef.current + 1
    setPlaylists(state => ({ ...state, isLoadingMore: true }))

    const page = await fetchPlaylistSearchPage(activeQuery, nextPage)
    isLoadingMoreRef.current = false
    if (requestIdRef.current !== requestId) return

    playlistPageRef.current = nextPage
    setPlaylists(state => {
      const items = [...state.items, ...page.playlists]
      return {
        hasMore: items.length < page.count && page.playlists.length > 0,
        isLoading: false,
        isLoadingMore: false,
        items,
      }
    })
  }, [playlists.hasMore])

  return {
    playlists: { ...playlists, loadMore: loadMorePlaylists },
    preachers: {
      hasMore: sermons.hasMore,
      isLoading: sermons.isLoading,
      isLoadingMore: sermons.isLoadingMore,
      items: collectMatchingPreachers(sermons.items, trimmedQuery),
      loadMore: loadMoreSermons,
    },
    sermons: { ...sermons, loadMore: loadMoreSermons },
  }
}
