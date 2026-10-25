export const getItemsByRows = (itemsCount: number, itemsRows: number): number[] => {
  const rows: number[] = []
  let rowIndex = 0
  for (let i = 0; i < itemsCount; i++) {
    if (!rows[rowIndex]) rows[rowIndex] = 0
    rows[rowIndex]++
    rowIndex++
    if (rowIndex >= itemsRows) rowIndex = 0
  }
  return rows
}
