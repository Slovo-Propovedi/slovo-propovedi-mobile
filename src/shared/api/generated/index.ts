// Импортируем все сгенерированные функции из Orval
import * as APITypes from './api.schemas'
import * as authApi from './auth/auth'
import * as authMocks from './auth/auth.faker'
import * as filesApi from './files/files'
import * as filesMocks from './files/files.faker'
import * as playlistsApi from './playlists/playlists'
import * as playlistsMocks from './playlists/playlists.faker'
import * as sectionsApi from './sections/sections'
import * as sectionsMocks from './sections/sections.faker'
import * as sermonsApi from './sermons/sermons'
import * as sermonsMocks from './sermons/sermons.faker'
import * as usersApi from './users/users'
import * as usersMocks from './users/users.faker'

// Реэкспортируем модули API и типы
export {
  APITypes,
  authApi,
  authMocks,
  filesApi,
  filesMocks,
  playlistsApi,
  playlistsMocks,
  sectionsApi,
  sectionsMocks,
  sermonsApi,
  sermonsMocks,
  usersApi,
  usersMocks,
}
