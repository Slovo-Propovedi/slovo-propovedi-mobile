import { SEARCH_HISTORY } from 'shared/config'
import { getCachedJson, setCachedJson } from 'shared/lib/cache'
import { reportError } from 'shared/model/error-dialog'
import { type SearchHistory, searchHistorySchema } from '../model/types'

let searchHistoryWriteQueue: Promise<void> = Promise.resolve()

const enqueueSearchHistoryWrite = (entries: SearchHistory): Promise<void> => {
  searchHistoryWriteQueue = searchHistoryWriteQueue
    .then(() => setCachedJson(SEARCH_HISTORY, entries))
    .catch(error => {
      console.error('Search history write failed:', error)
      reportError(error, 'Не удалось сохранить историю поиска')
    })

  return searchHistoryWriteQueue
}

export const readSearchHistory = async (): Promise<SearchHistory> => {
  const result = await getCachedJson(SEARCH_HISTORY, searchHistorySchema)
  return result ?? []
}

export const writeSearchHistory = (entries: SearchHistory): Promise<void> =>
  enqueueSearchHistoryWrite(entries)
