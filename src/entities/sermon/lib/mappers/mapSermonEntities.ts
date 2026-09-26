import { type APITypes } from 'shared/api'
import { type SermonData } from '../../model/sermon'
import { mapSermonEntityToSermonData } from './mapSermonEntityToSermonData'

/**
 * Маппер массива: SermonEntity[] -> SermonData[].
 * @param apiSermons - Массив проповедей из API.
 */
export const mapSermonEntities = (apiSermons: APITypes.SermonEntity[]): SermonData[] =>
  apiSermons.map(mapSermonEntityToSermonData)
