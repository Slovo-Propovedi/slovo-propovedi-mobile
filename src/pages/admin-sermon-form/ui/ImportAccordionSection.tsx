import { useState } from 'react'
import { ImportAudioPanel } from 'features/sermon-audio-import'
import { CollapsibleSection } from 'shared/ui'
import { type SermonFormValues } from '../lib/sermonFormInitialValues'

const TITLE = 'Импорт проповеди'

type UpdateField = <K extends keyof SermonFormValues>(key: K, value: SermonFormValues[K]) => void

/**
 * Сворачиваемый блок импорта аудио вверху формы проповеди. Свёрнут по
 * умолчанию: импорт нужен не каждой проповеди, а основным полям — максимум места.
 * @param props - Пропсы секции.
 * @param props.onChange - Обновляет поле формы.
 * @param props.values - Текущие значения формы.
 */
export const ImportAccordionSection = ({
  onChange,
  values,
}: {
  onChange: UpdateField
  values: SermonFormValues
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <CollapsibleSection
      title={TITLE}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(isOpen => !isOpen)}
    >
      <ImportAudioPanel
        youtubeUrl={values.youtubeUrl}
        hasAudio={Boolean(values.audioUrl)}
        onImportUrl={url => onChange('youtubeUrl', url)}
        onAudioImported={audioUrl => onChange('audioUrl', audioUrl)}
        onMetadata={({ description, title }) => {
          onChange('description', description ?? '')
          onChange('title', title)
        }}
      />
    </CollapsibleSection>
  )
}
