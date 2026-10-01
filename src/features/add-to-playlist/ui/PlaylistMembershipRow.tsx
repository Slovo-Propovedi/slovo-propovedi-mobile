import { useCtx } from '@reatom/npm-react'
import { togglePlaylistSermon } from 'entities/playlist'
import { CheckboxField } from 'shared/ui/form'

/**
 * Строка мультивыбора: название плейлиста + чекбокс. Тап по строке немедленно
 * переключает принадлежность проповеди (оптимистичный экшен сущности), не
 * закрывая модалку — так работает мультивыбор.
 * @param root0 - Пропсы строки.
 * @param root0.isContained - Содержит ли плейлист проповедь (состояние чекбокса).
 * @param root0.playlistId - Id плейлиста.
 * @param root0.sermonId - Id проповеди.
 * @param root0.title - Название плейлиста.
 */
export const PlaylistMembershipRow = ({
  isContained,
  playlistId,
  sermonId,
  title,
}: {
  isContained: boolean
  playlistId: string
  sermonId: string
  title: string
}) => {
  const ctx = useCtx()

  const handleChange = () => {
    void togglePlaylistSermon(ctx, playlistId, sermonId, !isContained)
  }

  return <CheckboxField label={title} value={isContained} onChange={handleChange} />
}
