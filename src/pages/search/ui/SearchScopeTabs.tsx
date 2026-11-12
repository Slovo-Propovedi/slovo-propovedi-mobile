import { UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE } from 'widgets/tab-bar/ui/useTabPress'
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
  const items: PillTabItem[] = [
    { key: 'listen', label: 'Слушать' },
    { disabled: !isReadEnabled, key: 'read', label: 'Читать' },
  ]

  return (
    <PillTabs
      stretch
      items={items}
      value={value}
      onChange={onChange}
      onDisabledPress={() => showInfo(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)}
    />
  )
}
