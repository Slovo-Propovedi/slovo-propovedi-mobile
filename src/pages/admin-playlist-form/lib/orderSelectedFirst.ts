/**
 * Ставит выбранные элементы в начало списка, сохраняя их взаимный порядок.
 * Используется пикерами формы плейлиста: отмеченное видно сразу, остальное —
 * ниже. Элементы, не попавшие ни в один список (отфильтрованные поиском),
 * игнорируются — вызывающий сам решает, что передавать.
 * @param items - Элементы для упорядочивания.
 * @param selectedIds - Идентификаторы выбранных элементов, идущих первыми.
 * @param getId - Извлекает идентификатор элемента.
 */
export const orderSelectedFirst = <T>(
  items: T[],
  selectedIds: string[],
  getId: (item: T) => string,
): T[] => {
  const selectedIdSet = new Set(selectedIds)
  const selected: T[] = []
  const rest: T[] = []

  for (const item of items) {
    if (!selectedIdSet.has(getId(item))) {
      rest.push(item)
      continue
    }

    selected.push(item)
  }

  return [...selected, ...rest]
}
