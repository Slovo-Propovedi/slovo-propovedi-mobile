import { type SectionData } from '../../model/domain/common'
import { type APITypes } from '../generated'
import { mapSectionEntityToSectionData } from './mapSectionEntityToSectionData'

/**
 * Маппер ответа API: AllSectionsResponse -> SectionData[].
 * @param response - Ответ API с секциями.
 */
export const mapAllSectionsResponse = (response: APITypes.AllSectionsResponse): SectionData[] =>
  (response.sections ?? []).map(mapSectionEntityToSectionData)
