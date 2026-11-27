import { ScreenTitleRow } from 'shared/ui'
import { ListenTopActions } from './ListenTopActions'

// Compact-only title row: wide renders no row at all (the island inset is the
// gap) and floats the actions in the fixed WideTopActions overlay.
export const ListenTopRow = ({ showAdminButton }: { showAdminButton: boolean }) => (
  <ScreenTitleRow title='Слушать'>
    <ListenTopActions showAdminButton={showAdminButton} />
  </ScreenTitleRow>
)
