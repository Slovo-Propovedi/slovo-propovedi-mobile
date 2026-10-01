import { type APITypes, sermonsApi } from 'shared/api'

export const SERMONS_PAGE_SIZE = 20

/**
 * Одна страница проповедей; `hasMore` вызывающий считает по размеру страницы.
 * @param query - Поисковый запрос (название, проповедник, книга, описание).
 * @param sort - Вариант сортировки.
 * @param order - Направление сортировки.
 * @param page - Номер страницы (с 1).
 */
export const fetchSermonsPage = async (
  query: string,
  sort: APITypes.SermonControllerFindAllSort,
  order: APITypes.SermonControllerFindAllOrder,
  page: number,
): Promise<APITypes.AllSermonsResponse> =>
  sermonsApi.getSermons().sermonControllerFindAll({
    limit: SERMONS_PAGE_SIZE,
    order,
    page,
    search: query || undefined,
    sort,
  })
