import { buildAudioFileName } from './audioFileName'

const TITLE = 'Проповедь о покаянии'

describe('buildAudioFileName', () => {
  test('builds an m4a name from the video title', () => {
    expect(buildAudioFileName(TITLE)).toBe(`${TITLE}.m4a`)
  })

  test('replaces path separators and forbidden characters', () => {
    expect(buildAudioFileName('Проповедь: "о покаянии" / 1')).toBe(
      'Проповедь- -о покаянии- - 1.m4a',
    )
  })

  test('falls back to a generic name for an empty title', () => {
    expect(buildAudioFileName('   ')).toBe('youtube-audio.m4a')
  })

  test('truncates an overly long title', () => {
    expect(buildAudioFileName('я'.repeat(120))).toBe(`${'я'.repeat(80)}.m4a`)
  })
})
