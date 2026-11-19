import { atom } from '@reatom/framework'
import { type SermonProgressRecord } from '../lib/progressStorage'

// НЕОГРАНИЧЕННОЕ per-sermon хранилище прогресса: источник индикации
// «прослушан и насколько» для проповедей, вытесненных из каталога истории
// (каталог обрезан до 100 записей). Гидратируется в loadHistoryAction.
export const sermonProgressAtom = atom<Record<string, SermonProgressRecord>>(
  {},
  'sermonProgressAtom',
)
