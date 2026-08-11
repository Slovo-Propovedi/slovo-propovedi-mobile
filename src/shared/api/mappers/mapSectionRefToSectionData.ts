import { type SectionData } from '../../model/domain/common'
import { type APITypes } from '../generated'

/**
 * Маппер: SectionRef (API) -> SectionData (App).
 * SectionRef — лёгкая ссылка на секцию (только id и title).
 * Поля itemsSize и transform заполняются значениями по умолчанию.
 * @param sectionRef - Ссылка на секцию из API.
 */
export const mapSectionRefToSectionData = (sectionRef: APITypes.SectionRef): SectionData => ({
  id: sectionRef.id,
  itemsSize: 'middle',
  title: sectionRef.title,
  transform: 'middle',
})
