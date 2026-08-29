import { RepeatMode } from '../../model'
import { resolveTrackToggle, type TrackDirection } from './resolveTrackToggle'

type ToggleCase =
  | {
      boundary: 'first' | 'last'
      dir: TrackDirection
      expected: 'boundary'
      index: number
      name: string
      repeatMode: RepeatMode
      totalTracks: number
    }
  | {
      dir: TrackDirection
      expected: 'restart'
      index: number
      name: string
      repeatMode: RepeatMode
      totalTracks: number
    }
  | {
      dir: TrackDirection
      expected: 'switch'
      index: number
      name: string
      newIndex: number
      repeatMode: RepeatMode
      totalTracks: number
    }

const CASES: ToggleCase[] = [
  {
    dir: 'next',
    expected: 'switch',
    index: 1,
    name: 'Off + next in the middle → switch to next index',
    newIndex: 2,
    repeatMode: RepeatMode.Off,
    totalTracks: 3,
  },
  {
    dir: 'prev',
    expected: 'switch',
    index: 1,
    name: 'Off + prev in the middle → switch to prev index',
    newIndex: 0,
    repeatMode: RepeatMode.Off,
    totalTracks: 3,
  },
  {
    boundary: 'last',
    dir: 'next',
    expected: 'boundary',
    index: 2,
    name: 'Off + next on last track → boundary last',
    repeatMode: RepeatMode.Off,
    totalTracks: 3,
  },
  {
    boundary: 'first',
    dir: 'prev',
    expected: 'boundary',
    index: 0,
    name: 'Off + prev on first track → boundary first',
    repeatMode: RepeatMode.Off,
    totalTracks: 3,
  },
  {
    dir: 'next',
    expected: 'restart',
    index: 2,
    name: 'Track + next on last track → restart',
    repeatMode: RepeatMode.Track,
    totalTracks: 3,
  },
  {
    dir: 'prev',
    expected: 'restart',
    index: 0,
    name: 'Track + prev on first track → restart',
    repeatMode: RepeatMode.Track,
    totalTracks: 3,
  },
  {
    dir: 'next',
    expected: 'restart',
    index: 1,
    name: 'Track + next in the middle → restart',
    repeatMode: RepeatMode.Track,
    totalTracks: 3,
  },
  {
    dir: 'next',
    expected: 'switch',
    index: 2,
    name: 'Queue + next on last track → wrap to first',
    newIndex: 0,
    repeatMode: RepeatMode.Queue,
    totalTracks: 3,
  },
  {
    dir: 'prev',
    expected: 'switch',
    index: 0,
    name: 'Queue + prev on first track → wrap to last',
    newIndex: 2,
    repeatMode: RepeatMode.Queue,
    totalTracks: 3,
  },
  {
    dir: 'next',
    expected: 'switch',
    index: 0,
    name: 'Queue + single track → wraps to itself',
    newIndex: 0,
    repeatMode: RepeatMode.Queue,
    totalTracks: 1,
  },
  {
    boundary: 'last',
    dir: 'next',
    expected: 'boundary',
    index: 0,
    name: 'Off + single track next → boundary last',
    repeatMode: RepeatMode.Off,
    totalTracks: 1,
  },
]

const buildExpected = (c: ToggleCase) => {
  if (c.expected === 'switch') return { kind: 'switch', newIndex: c.newIndex }
  if (c.expected === 'restart') return { kind: 'restart' }
  return { boundary: c.boundary, kind: 'boundary' }
}

describe('resolveTrackToggle', () => {
  test.each(CASES)('$name', c => {
    expect(resolveTrackToggle(c.dir, c.index, c.totalTracks, c.repeatMode)).toEqual(
      buildExpected(c),
    )
  })
})
