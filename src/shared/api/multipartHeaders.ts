import { type InternalAxiosRequestConfig } from 'axios'

const MULTIPART_CONTENT_TYPE = /^multipart\/form-data/i
const CONTENT_TYPE_BOUNDARY = /boundary=/i

const isFormDataBody = (data: unknown): boolean =>
  typeof FormData !== 'undefined' && data instanceof FormData

/**
 * Сгенерированный Orval multipart-клиент ставит `Content-Type:
 * multipart/form-data` вручную. Браузерный xhr-адаптер (в отличие от
 * fetch-адаптера axios) отправляет его как есть — без boundary, и сервер не
 * может разобрать тело. Убираем заголовок без boundary у FormData-запроса:
 * адаптер (xhr в браузере / сетевой слой RN) проставит корректный сам.
 * @param config - Запрос axios, у которого проверяется и чистится Content-Type.
 */
export const dropBoundarylessMultipartHeader = (config: InternalAxiosRequestConfig): void => {
  if (!isFormDataBody(config.data)) return

  const contentType = config.headers.getContentType()
  if (typeof contentType !== 'string') return
  if (!MULTIPART_CONTENT_TYPE.test(contentType)) return
  if (CONTENT_TYPE_BOUNDARY.test(contentType)) return

  config.headers.delete('Content-Type')
}
