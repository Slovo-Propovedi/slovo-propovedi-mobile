import { type SermonData } from '../../model/domain/common'
import { type APITypes } from '../generated'
import { mapSermonEntities } from './mapSermonEntities'

/**
 * Маппер ответа API: AllSermonsResponse -> SermonData[].
 * @param response - Ответ API с проповедями.
 */
export const mapAllSermonsResponse = (response: APITypes.AllSermonsResponse): SermonData[] =>
  mapSermonEntities(response.sermons ?? [])
