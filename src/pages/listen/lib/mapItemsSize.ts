import { SliderItemSize } from 'shared/ui'

export const mapItemsSize = (size?: string): SliderItemSize => {
  const map: Record<string, SliderItemSize> = {
    large: SliderItemSize.Large,
    middle: SliderItemSize.Middle,
    small: SliderItemSize.Small,
    xLarge: SliderItemSize.XLarge,
  }
  const normalizedSize = size ?? 'middle'
  const result = map[normalizedSize] ?? SliderItemSize.Middle
  if (size && !map[size])
    console.warn(`Unexpected itemsSize value: "${size}", falling back to middle`)

  return result
}
