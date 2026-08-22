import { LISTENING_HISTORY } from 'shared/config'
import { getCachedJson, setCachedJson } from 'shared/lib/cache'
import { reportError } from 'shared/model/error-dialog'
import { type ListeningHistory, listeningHistorySchema } from '../model/types'

let historyWriteQueue: Promise<void> = Promise.resolve()

const enqueueHistoryWrite = (entries: ListeningHistory): Promise<void> => {
  historyWriteQueue = historyWriteQueue
    .then(() => setCachedJson(LISTENING_HISTORY, entries))
    .catch(error => {
      console.error('History write failed:', error)
      reportError(error, 'Не удалось сохранить историю прослушивания')
    })

  return historyWriteQueue
}

export const readHistory = async (): Promise<ListeningHistory> => {
  const result = await getCachedJson(LISTENING_HISTORY, listeningHistorySchema)
  return result ?? []
}

export const writeHistory = (entries: ListeningHistory): Promise<void> =>
  enqueueHistoryWrite(entries)
