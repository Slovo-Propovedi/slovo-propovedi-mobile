/**
 * Объединяет два списка по id, сохраняя порядок: `primary` идёт первым, а
 * совпадающие по id элементы из `secondary` отбрасываются. Детерминированно:
 * при дубликате побеждает копия из `primary`.
 *
 * Используется пикером проповедей: найденная на странице копия (`primary`)
 * перекрывает снапшот уже включённых в плейлист проповедей (`secondary`), а
 * включённые вне загруженных страниц остаются в списке.
 * @param primary - Список-победитель при совпадении id.
 * @param secondary - Дополняющий список.
 */
export const mergeById = <T extends { id: string }>(primary: T[], secondary: T[]): T[] => {
  const seenIds = new Set<string>()
  const merged: T[] = []

  for (const item of [...primary, ...secondary]) {
    if (seenIds.has(item.id)) continue
    seenIds.add(item.id)
    merged.push(item)
  }

  return merged
}
