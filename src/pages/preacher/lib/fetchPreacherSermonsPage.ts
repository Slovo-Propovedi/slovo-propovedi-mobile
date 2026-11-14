import { mapAllSermonsResponse, type SermonData } from 'entities/sermon'
import { type APITypes, sermonsApi } from 'shared/api'

const PREACHER_PAGE_SIZE = 20

const AUTO_CONTINUE_PAGE_LIMIT = 10

interface PreacherSermonsPage {
  nextCursor: null | string
  sermons: SermonData[]
}

const normalizeArtist = (artist: string) => artist.trim().toLowerCase()

const belongsToArtist = (sermon: SermonData, normalizedArtist: string) =>
  normalizeArtist(sermon.artist) === normalizedArtist

/**
 * Fetches sermon pages until at least one exact-artist sermon is found or the
 * cursor ends. `GET /sermons` has no artist filter and `search` also matches
 * title/book/description, so exact-artist matching happens client-side; a page
 * without matches is skipped so the screen never shows a false empty state.
 * @param artist - Preacher name; matched case- and whitespace-insensitively.
 * @param cursor - Keyset cursor of the previous page; omitted for the first page.
 */
export const fetchPreacherSermonsPage = async (
  artist: string,
  cursor?: string,
): Promise<PreacherSermonsPage> => {
  const normalizedArtist = normalizeArtist(artist)
  const sermons: SermonData[] = []
  let nextCursor: null | string = cursor ?? null
  let fetchedPages = 0

  do {
    const params: APITypes.SermonControllerFindAllParams = {
      search: artist,
      take: PREACHER_PAGE_SIZE,
    }
    if (nextCursor !== null) params.cursor = nextCursor

    const response = await sermonsApi.getSermons().sermonControllerFindAll(params)
    const matches = mapAllSermonsResponse(response).filter(sermon =>
      belongsToArtist(sermon, normalizedArtist),
    )
    sermons.push(...matches)
    nextCursor = response.nextCursor ?? null
    fetchedPages += 1
  } while (sermons.length === 0 && nextCursor !== null && fetchedPages < AUTO_CONTINUE_PAGE_LIMIT)

  return { nextCursor, sermons }
}
