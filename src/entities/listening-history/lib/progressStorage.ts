import AsyncStorage from '@react-native-async-storage/async-storage'
import z from 'zod'
import { reportError } from 'shared/model/error-dialog'

// Ключи AsyncStorage, которыми владеет listening-history: НЕОГРАНИЧЕННОЕ
// per-sermon хранилище прогресса (индикация «прослушан и насколько» в списках).
// Каталог истории (listeningHistory) обрезан до 100 записей и не может нести
// прогресс вытесненных проповедей — поэтому прогресс живёт отдельно, по ключу
// на проповедь (прецедент entity-owned ключей — offline-cache/lib/storageKeys).
export const SERMON_PROGRESS_PREFIX = 'sermonProgress:'

const sermonProgressRecordSchema = z.object({
  durationMs: z.number().nonnegative(),
  positionMs: z.number().nonnegative(),
  updatedAt: z.number(),
})

export type SermonProgressRecord = z.infer<typeof sermonProgressRecordSchema>

export const sermonProgressMapSchema = z.record(z.string(), sermonProgressRecordSchema)

const progressKey = (sermonId: string): string => `${SERMON_PROGRESS_PREFIX}${sermonId}`

let progressWriteQueue: Promise<void> = Promise.resolve()

const enqueueProgressWrite = (op: () => Promise<void>): Promise<void> => {
  progressWriteQueue = progressWriteQueue.then(op).catch(error => {
    console.error('Progress write failed:', error)
    reportError(error, 'Не удалось сохранить прогресс прослушивания')
  })

  return progressWriteQueue
}

const parseRecord = (raw: null | string): SermonProgressRecord | undefined => {
  if (!raw) return undefined

  try {
    const result = sermonProgressRecordSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

/** Хранилище недоверенное: каждая запись проходит safeParse, невалидные отбрасываются. */
export const readProgressRecords = async (): Promise<Record<string, SermonProgressRecord>> => {
  const keys = (await AsyncStorage.getAllKeys()).filter(key =>
    key.startsWith(SERMON_PROGRESS_PREFIX),
  )
  if (keys.length === 0) return {}

  const pairs = await AsyncStorage.multiGet(keys)
  const records: Record<string, SermonProgressRecord> = {}

  for (const [key, raw] of pairs) {
    const record = parseRecord(raw)
    if (record) records[key.slice(SERMON_PROGRESS_PREFIX.length)] = record
  }

  return records
}

export const writeProgressRecords = (
  records: Record<string, SermonProgressRecord>,
): Promise<void> => {
  const entries = Object.entries(records)
  if (entries.length === 0) return Promise.resolve()

  return enqueueProgressWrite(() =>
    AsyncStorage.multiSet(
      entries.map(([sermonId, record]) => [progressKey(sermonId), JSON.stringify(record)]),
    ),
  )
}

export const removeProgressRecords = (sermonIds: string[]): Promise<void> => {
  if (sermonIds.length === 0) return Promise.resolve()

  return enqueueProgressWrite(() => AsyncStorage.multiRemove(sermonIds.map(progressKey)))
}

export const clearProgressRecords = (): Promise<void> =>
  // Ключи выбираются ВНУТРИ очереди: иначе чтение ключей обогнало бы
  // предыдущую запись и очистка удалила бы не всё.
  enqueueProgressWrite(async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter(key =>
      key.startsWith(SERMON_PROGRESS_PREFIX),
    )
    if (keys.length > 0) await AsyncStorage.multiRemove(keys)
  })
