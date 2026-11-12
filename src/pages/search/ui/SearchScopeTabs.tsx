import { useAction } from '@reatom/npm-react'
import { UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE } from 'widgets/tab-bar/ui/useTabPress'
import { requestSearchFocus } from 'features/sermon-search'
import { useFeatureFlag } from 'entities/feature-flags'
import { showInfo } from 'shared/model/info-dialog'
import { type PillTabItem, PillTabs } from './PillTabs'

export type SearchScope = 'listen' | 'read'

export const SearchScopeTabs = ({
  onChange,
  value,
}: {
  onChange: (key: string) => void
  value: SearchScope
}) => {
  const isReadEnabled = useFeatureFlag('read')
  const requestFocus = useAction(requestSearchFocus)
  const items: PillTabItem[] = [
    { key: 'listen', label: 'Слушать' },
    { disabled: !isReadEnabled, key: 'read', label: 'Читать' },
  ]

  // The press itself blurs the field and the modal keeps focus while open, so
  // the request is raised on both sides: before the dialog and once it closes.
  const handleDisabledPress = () => {
    requestFocus()
    showInfo(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE, {
      onDismiss: () => requestFocus(),
    })
  }

  return (
    <PillTabs
      stretch
      items={items}
      value={value}
      onChange={onChange}
      onDisabledPress={handleDisabledPress}
    />
  )
}
