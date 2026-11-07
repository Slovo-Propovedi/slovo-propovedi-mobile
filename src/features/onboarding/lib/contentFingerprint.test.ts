import { contentFingerprint } from './contentFingerprint'

const STEPS = [
  { text: 'Первая карточка', title: 'Начало' },
  { route: '/offline', targetId: 'offline.rows', text: 'Вторая', title: 'Дальше' },
]

describe('contentFingerprint', () => {
  test('produces the same fingerprint for the same content', () => {
    expect(contentFingerprint(STEPS)).toBe(contentFingerprint([...STEPS]))
  })

  test('is a stable eight-character hex string', () => {
    expect(contentFingerprint(STEPS)).toMatch(/^[0-9a-f]{8}$/)
  })

  test('changes when the card text changes', () => {
    const changed = [{ ...STEPS[0], text: 'Новый текст' }, STEPS[1]]

    expect(contentFingerprint(changed)).not.toBe(contentFingerprint(STEPS))
  })

  test('changes when the step order changes', () => {
    expect(contentFingerprint([STEPS[1], STEPS[0]])).not.toBe(contentFingerprint(STEPS))
  })

  test('changes when a nested option array changes', () => {
    const highlighted = [{ areaTargetIds: ['player.controls'] }]
    const highlightedWider = [{ areaTargetIds: ['player.controls', 'player.repeat'] }]

    expect(contentFingerprint(highlighted)).not.toBe(contentFingerprint(highlightedWider))
  })
})
