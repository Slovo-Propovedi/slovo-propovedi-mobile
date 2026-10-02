import { WhereIsSlideTitleLocated } from 'shared/ui'

export const mapWhereIsTitleLocated = (where?: string): WhereIsSlideTitleLocated => {
  // `bothOnAndUnder` is legacy: the option was removed from both forms, so it is
  // read as `under` (title under the card, description on the card).
  const map: Record<string, WhereIsSlideTitleLocated> = {
    bothOnAndUnder: WhereIsSlideTitleLocated.Under,
    on: WhereIsSlideTitleLocated.On,
    under: WhereIsSlideTitleLocated.Under,
  }
  const normalizedWhere = where ?? 'under'
  const result = map[normalizedWhere] ?? WhereIsSlideTitleLocated.Under
  if (where && !map[where])
    console.warn(`Unexpected whereIsSlideTitleLocated value: "${where}", falling back to under`)

  return result
}
