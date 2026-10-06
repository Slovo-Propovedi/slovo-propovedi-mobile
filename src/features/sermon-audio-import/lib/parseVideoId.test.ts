import { parseVideoId } from './parseVideoId'

const VIDEO_ID = 'lV6YkF7ytxs'

describe('parseVideoId', () => {
  test.each([
    ['watch', `https://www.youtube.com/watch?v=${VIDEO_ID}`],
    ['watch with extra params', `https://www.youtube.com/watch?list=PL123&t=42&v=${VIDEO_ID}`],
    ['short host', `https://youtu.be/${VIDEO_ID}`],
    ['shorts', `https://www.youtube.com/shorts/${VIDEO_ID}`],
    ['embed', `https://www.youtube.com/embed/${VIDEO_ID}?rel=0`],
    ['live', `https://www.youtube.com/live/${VIDEO_ID}`],
    ['v path', `https://www.youtube.com/v/${VIDEO_ID}`],
    ['mobile host', `https://m.youtube.com/watch?v=${VIDEO_ID}`],
    ['music host', `https://music.youtube.com/watch?v=${VIDEO_ID}`],
    ['bare id', VIDEO_ID],
    ['bare id with spaces', `  ${VIDEO_ID}  `],
  ])('reads the video id from %s', (_form, url) => {
    expect(parseVideoId(url)).toBe(VIDEO_ID)
  })

  test.each([
    ['empty string', ''],
    ['spaces only', '   '],
    ['garbage', 'not a url at all'],
    ['foreign host', `https://vimeo.com/watch?v=${VIDEO_ID}`],
    ['host that only mentions youtube', `https://youtube.com.evil.test/watch?v=${VIDEO_ID}`],
    ['id too short', 'https://www.youtube.com/watch?v=lV6YkF7ytx'],
    ['id too long', 'https://www.youtube.com/watch?v=lV6YkF7ytxsx'],
    ['id with illegal chars', 'https://www.youtube.com/watch?v=lV6YkF7yt!s'],
    ['youtube host without id', 'https://www.youtube.com/feed/trending'],
    ['url without protocol', `youtube.com/watch?v=${VIDEO_ID}`],
  ])('rejects %s', (_case, url) => {
    expect(parseVideoId(url)).toBeNull()
  })
})
