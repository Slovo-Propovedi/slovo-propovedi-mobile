import { WhereIsSlideTitleLocated } from 'shared/ui'

export const mapWhereIsTitleLocated = (where?: string): WhereIsSlideTitleLocated => {
  const map: Record<string, WhereIsSlideTitleLocated> = {
    bothOnAndUnder: WhereIsSlideTitleLocated.BothOnAndUnder,
    on: WhereIsSlideTitleLocated.On,
    under: WhereIsSlideTitleLocated.Under,
  }
  const normalizedWhere = where ?? 'under'
  const result = map[normalizedWhere] ?? WhereIsSlideTitleLocated.Under
  if (where && !map[where])
    console.warn(`Unexpected whereIsSlideTitleLocated value: "${where}", falling back to under`)

  return result
}
