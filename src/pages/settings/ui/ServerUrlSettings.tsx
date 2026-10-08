import { useAtom } from '@reatom/npm-react'
import { useState } from 'react'
import { serverUrlAtom } from 'shared/model'
import { CollapsibleGroup } from 'shared/ui/collapsible-group'
import { ServerUrlForm } from './ServerUrlForm'

export const ServerUrlSettings = () => {
  const [expanded, setExpanded] = useState(false)
  const [currentUrl] = useAtom(serverUrlAtom)

  return (
    <CollapsibleGroup
      expanded={expanded}
      title='URL сервера API'
      subtitle={`Текущий: ${currentUrl}`}
      onToggle={() => setExpanded(prev => !prev)}
    >
      <ServerUrlForm />
    </CollapsibleGroup>
  )
}
