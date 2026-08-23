import { useAtom } from '@reatom/npm-react'
import { updateDialogVisibleAtom } from 'shared/model'
import { UpdateDialog } from './UpdateDialog'

export const UpdateDialogRoot = () => {
  const [isDialogVisible, setIsDialogVisible] = useAtom(updateDialogVisibleAtom)

  return <UpdateDialog visible={isDialogVisible} onClose={() => setIsDialogVisible(false)} />
}
