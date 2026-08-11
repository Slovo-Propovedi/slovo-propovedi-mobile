import { type SermonData } from '../../model/domain/common'
import { type APITypes } from '../generated'
import { mapSermonEntityToSermonData } from './mapSermonEntityToSermonData'

/**
 * Маппер массива: SermonEntity[] -> SermonData[].
 * @param apiSermons - Массив проповедей из API.
 */
export const mapSermonEntities = (apiSermons: APITypes.SermonEntity[]): SermonData[] =>
  apiSermons.map(mapSermonEntityToSermonData)
