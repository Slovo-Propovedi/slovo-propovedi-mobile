import { ScreenTitleRow } from 'shared/ui'
import { ListenTopActions } from './ListenTopActions'

export const ListenTopRow = ({
  isWide,
  showAdminButton,
}: {
  isWide: boolean
  showAdminButton: boolean
}) => (
  // Compact keeps the actions in the title row; wide floats them in the fixed
  // top-right overlay (WideTopActions), so the row keeps only its spacer.
  <ScreenTitleRow title='Слушать' hideTitle={isWide}>
    {isWide ? null : <ListenTopActions showAdminButton={showAdminButton} />}
  </ScreenTitleRow>
)
