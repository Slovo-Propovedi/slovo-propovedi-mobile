import { SearchGroup } from './SearchGroup'
import { SearchPreacherRow } from './SearchPreacherRow'

const PREACHERS_LABEL = 'Проповедники'
const MAX_PREACHER_RESULTS = 5

export const SearchPreacherGroup = ({
  onPress,
  onShowAll,
  preachers,
}: {
  onPress: (artist: string) => void
  onShowAll: () => void
  preachers: string[]
}) => (
  <SearchGroup onPress={onShowAll} label={PREACHERS_LABEL} count={preachers.length}>
    {preachers.slice(0, MAX_PREACHER_RESULTS).map(artist => (
      <SearchPreacherRow key={artist} artist={artist} onPress={onPress} />
    ))}
  </SearchGroup>
)
