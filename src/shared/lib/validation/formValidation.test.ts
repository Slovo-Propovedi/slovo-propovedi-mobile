import {
  artworkUrlError,
  fileUrlError,
  maxItemsError,
  maxLengthError,
  passwordError,
  urlError,
} from './formValidation'

describe('maxLengthError', () => {
  test('is silent within the limit and counts the trimmed value', () => {
    expect(maxLengthError('  abc  ', 3, 'Название')).toBe('')
  })

  test('reports the exceeded limit with the field label', () => {
    expect(maxLengthError('abcd', 3, 'Название')).toBe('Название: не более 3 символов.')
  })
})

describe('maxItemsError', () => {
  test('is silent within the limit', () => {
    expect(maxItemsError(2, 2, 'Плейлисты')).toBe('')
  })

  test('reports the exceeded array size', () => {
    expect(maxItemsError(3, 2, 'Плейлисты')).toBe('Плейлисты: не более 2 значений.')
  })
})

describe('passwordError', () => {
  test('rejects a password shorter than the minimum', () => {
    expect(passwordError('1234567')).toBe('Пароль должен содержать минимум 8 символов.')
  })

  test('accepts a password within the bounds', () => {
    expect(passwordError('12345678')).toBe('')
    expect(passwordError('a'.repeat(200))).toBe('')
  })

  test('rejects a password longer than the maximum', () => {
    expect(passwordError('a'.repeat(201))).toBe('Пароль должен содержать не более 200 символов.')
  })
})

describe('urlError', () => {
  test('accepts an empty value and an absolute URL', () => {
    expect(urlError('', 'YouTube')).toBe('')
    expect(urlError('  https://youtube.com/watch?v=1  ', 'YouTube')).toBe('')
  })

  test('rejects a relative or malformed link', () => {
    expect(urlError('not-a-url', 'YouTube')).toBe('YouTube: укажите корректную ссылку.')
  })

  test.each(['javascript:alert(1)', 'data:text/html,<script>1</script>'])(
    'rejects a non-http(s) scheme %p',
    value => {
      expect(urlError(value, 'YouTube')).toBe('YouTube: укажите корректную ссылку.')
    },
  )
})

describe('artworkUrlError', () => {
  test('accepts an empty value and an http(s) link', () => {
    expect(artworkUrlError('', 'Обложка')).toBe('')
    expect(artworkUrlError('https://cdn.example/files/cover.png', 'Обложка')).toBe('')
  })

  test.each(['javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'cover.png'])(
    'rejects %p',
    value => {
      expect(artworkUrlError(value, 'Обложка')).toBe('Обложка: укажите корректную ссылку.')
    },
  )
})

describe('fileUrlError', () => {
  test('accepts an empty value and a storage file URL', () => {
    expect(fileUrlError('', 'Аудио')).toBe('')
    expect(fileUrlError('https://cdn.example/files/sermon.mp3', 'Аудио')).toBe('')
  })

  test('rejects a link to an arbitrary host', () => {
    expect(fileUrlError('https://example.com/sermon.mp3', 'Аудио')).toBe(
      'Аудио: ссылка должна указывать на файл в хранилище (…/files/…).',
    )
  })
})
