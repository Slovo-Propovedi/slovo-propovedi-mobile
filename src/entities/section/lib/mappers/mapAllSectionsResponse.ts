import { type APITypes } from 'shared/api'
import { type SectionData } from '../../model'
import { mapSectionEntityToSectionData } from './mapSectionEntityToSectionData'

/**
 * Маппер ответа API: AllSectionsResponse -> SectionData[].
 * @param response - Ответ API с секциями.
 */
export const mapAllSectionsResponse = (response: APITypes.AllSectionsResponse): SectionData[] =>
  (response.sections ?? []).map(mapSectionEntityToSectionData)
