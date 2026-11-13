import { useCallback, useEffect, useRef, useState } from 'react'
import { type SermonData } from 'entities/sermon'
import { reportError } from 'shared/model/error-dialog'
import { fetchPreacherSermonsPage } from './fetchPreacherSermonsPage'

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить проповеди проповедника'

/**
 * Cursor-paged sermons of one preacher. The first page and every `loadMore`
 * skip pages where `search` matched only the title/book/description. An artist
 * change starts a new generation, so an in-flight page of the previous artist is
 * dropped instead of leaking into the new list.
 * @param artist - Preacher name from the route params; blank disables fetching.
 */
export const usePreacherSermons = (artist: string) => {
  const trimmedArtist = artist.trim()
  const [items, setItems] = useState<SermonData[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(() => Boolean(trimmedArtist))
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)

  const artistRef = useRef('')
  const cursorRef = useRef<null | string>(null)
  const isLoadingMoreRef = useRef(false)
  const generationRef = useRef(0)

  useEffect(() => {
    const generation = ++generationRef.current
    artistRef.current = trimmedArtist
    cursorRef.current = null
    isLoadingMoreRef.current = false

    const load = async () => {
      setIsLoading(true)
      setLoadMoreFailed(false)

      if (!trimmedArtist) {
        setItems([])
        setHasMore(false)
        setIsLoading(false)
        return
      }

      try {
        const page = await fetchPreacherSermonsPage(trimmedArtist)
        if (generationRef.current !== generation) return

        cursorRef.current = page.nextCursor
        setItems(page.sermons)
        setHasMore(page.nextCursor !== null)
      } catch (error) {
        if (generationRef.current !== generation) return
        reportError(error, LOAD_ERROR_MESSAGE)
        setItems([])
        setHasMore(false)
      } finally {
        if (generationRef.current === generation) setIsLoading(false)
      }
    }

    void load()
  }, [trimmedArtist])

  const loadMore = useCallback(async () => {
    const cursor = cursorRef.current
    if (!artistRef.current || cursor === null || isLoadingMoreRef.current) return

    const generation = generationRef.current
    isLoadingMoreRef.current = true
    setIsLoadingMore(true)
    setLoadMoreFailed(false)

    try {
      const page = await fetchPreacherSermonsPage(artistRef.current, cursor)
      if (generationRef.current !== generation) return

      cursorRef.current = page.nextCursor
      setItems(current => [...current, ...page.sermons])
      setHasMore(page.nextCursor !== null)
    } catch (error) {
      if (generationRef.current !== generation) return
      setLoadMoreFailed(true)
      reportError(error, LOAD_ERROR_MESSAGE)
    } finally {
      isLoadingMoreRef.current = false
      if (generationRef.current === generation) setIsLoadingMore(false)
    }
  }, [])

  return { hasMore, isLoading, isLoadingMore, items, loadMore, loadMoreFailed }
}
