import { type APITypes } from 'shared/api'
import { type SermonData } from '../../model/sermon'
import { mapSermonEntities } from './mapSermonEntities'

/**
 * Маппер ответа API: AllSermonsResponse -> SermonData[].
 * @param response - Ответ API с проповедями.
 */
export const mapAllSermonsResponse = (response: APITypes.AllSermonsResponse): SermonData[] =>
  mapSermonEntities(response.sermons ?? [])
