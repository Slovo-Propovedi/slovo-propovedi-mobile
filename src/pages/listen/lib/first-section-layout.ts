import { SCREEN_WIDTH } from 'shared/config/screen-dimensions'
import { getSliderItemWidth } from 'shared/ui'
import { INDENTS } from 'shared/ui/theme'
import type { SectionData } from 'shared/model'
import { TOTAL_SIZE } from '../ui/ContinueCircleButton'
import { FIRST_SKELETON_SECTION_SIZE } from '../ui/skeleton.constants'
import { mapItemsSize } from './mapItemsSize'

// два горизонтальных паддинга строки + gap между колонками
const ROW_HORIZONTAL_SPACING = INDENTS.medium * 3

// Слайдер получает paddingHorizontal: INDENTS.middle (12 с каждой стороны)
// через style-проп в renderSection.tsx — 24px суммарно на horizontal padding контейнера.
const SLIDER_PADDING = INDENTS.middle * 2

// WCAG 2.5.8: target size minimum — 44×44pt (or 44×44 CSS px on web).
const MIN_BUTTON_WIDTH = 44

// Экстремально узкие экраны (<250px) всегда стекают секцию под кнопку:
// в строку просто не помещаются полная карточка и кнопка.
const STACKED_SCREEN_WIDTH_LIMIT = 250

export interface FirstSectionLayout {
  buttonWidth: number
  sectionMinWidth: number | undefined // undefined for EmptyState / stacked mode
  stacked: boolean
}

export const getFirstSectionLayout = (
  sections: SectionData[],
  isLoading: boolean,
): FirstSectionLayout => {
  const firstSection = sections[0]
  if (!firstSection && !isLoading)
    return {
      buttonWidth: Math.min(TOTAL_SIZE, SCREEN_WIDTH - INDENTS.medium * 2),
      sectionMinWidth: undefined,
      stacked: false,
    }

  const cardWidth = firstSection
    ? getSliderItemWidth(mapItemsSize(firstSection.itemsSize))
    : getSliderItemWidth(FIRST_SKELETON_SECTION_SIZE)

  const ideal = cardWidth + SLIDER_PADDING
  const available = SCREEN_WIDTH - ROW_HORIZONTAL_SPACING

  const isStacked = SCREEN_WIDTH < STACKED_SCREEN_WIDTH_LIMIT
  if (isStacked)
    return {
      buttonWidth: Math.min(TOTAL_SIZE, SCREEN_WIDTH - INDENTS.medium * 2),
      sectionMinWidth: undefined,
      stacked: true,
    }

  // В row-режиме секция гарантированно показывает одну полную карточку (это минимум),
  // но на широких экранах растёт в свободное место (flex: 1 в FirstSectionRow).
  const sectionMinWidth = Math.min(Math.round(ideal), available - MIN_BUTTON_WIDTH)

  const buttonWidth = Math.round(
    Math.min(TOTAL_SIZE, Math.max(available - sectionMinWidth, MIN_BUTTON_WIDTH)),
  )

  return { buttonWidth, sectionMinWidth, stacked: false }
}
