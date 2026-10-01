import { SliderItemTransform } from 'shared/ui'

export const mapTransform = (transform?: null | string): SliderItemTransform | undefined => {
  if (transform === 'high') return SliderItemTransform.High
  if (transform === 'short') return SliderItemTransform.Short
  if (transform && transform !== 'middle')
    console.warn(
      `Unexpected transform value: "${transform}", expected "high", "short", or "middle"`,
    )

  return undefined
}
