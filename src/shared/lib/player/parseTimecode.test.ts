import { parseTimecodeSegments, timecodeToMs } from './parseTimecode'

describe('timecodeToMs', () => {
  test('converts M:SS timecode', () => {
    expect(timecodeToMs('23:30')).toBe(1_410_000)
  })

  test('converts H:MM:SS timecode', () => {
    expect(timecodeToMs('1:20:00')).toBe(4_800_000)
    expect(timecodeToMs('12:34:56')).toBe(45_296_000)
  })

  test('converts zero timecode to 0 ms', () => {
    expect(timecodeToMs('0:00')).toBe(0)
    expect(timecodeToMs('0:00:00')).toBe(0)
  })

  test('returns null for seconds above 59', () => {
    expect(timecodeToMs('1:75')).toBeNull()
    expect(timecodeToMs('1:20:75')).toBeNull()
  })

  test('returns null for malformed timecodes', () => {
    expect(timecodeToMs('10:2345')).toBeNull()
    expect(timecodeToMs('1:2')).toBeNull()
    expect(timecodeToMs('abc')).toBeNull()
  })
})

describe('parseTimecodeSegments', () => {
  test('returns a single text segment for text without timecodes', () => {
    expect(parseTimecodeSegments('Просто текст без таймкодов')).toEqual([
      { type: 'text', value: 'Просто текст без таймкодов' },
    ])
  })

  test('splits a description into text and timecode segments', () => {
    const description =
      'Проповедь начнётся с 5:00. Основная часть — на 23:30, а полтора часа спустя — 1:20:00.'

    expect(parseTimecodeSegments(description)).toEqual([
      { type: 'text', value: 'Проповедь начнётся с ' },
      { ms: 300_000, type: 'timecode', value: '5:00' },
      { type: 'text', value: '. Основная часть — на ' },
      { ms: 1_410_000, type: 'timecode', value: '23:30' },
      { type: 'text', value: ', а полтора часа спустя — ' },
      { ms: 4_800_000, type: 'timecode', value: '1:20:00' },
      { type: 'text', value: '.' },
    ])
  })

  test('keeps malformed lookalikes as plain text', () => {
    expect(parseTimecodeSegments('Время 10:2345 и 1:75')).toEqual([
      { type: 'text', value: 'Время 10:2345 и 1:75' },
    ])
  })

  test('handles a timecode at the start and at the end', () => {
    expect(parseTimecodeSegments('0:00 вступление, конец 59:59')).toEqual([
      { ms: 0, type: 'timecode', value: '0:00' },
      { type: 'text', value: ' вступление, конец ' },
      { ms: 3_599_000, type: 'timecode', value: '59:59' },
    ])
  })
})
