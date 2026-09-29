// Импортируем все сгенерированные функции из Orval
export * as authApi from './auth/auth'
export * as filesApi from './files/files'
export * as playlistsApi from './playlists/playlists'
export * as sectionsApi from './sections/sections'
export * as sermonsApi from './sermons/sermons'
export * as usersApi from './users/users'

export * as authMocks from './auth/auth.faker'
export * as filesMocks from './files/files.faker'
export * as playlistsMocks from './playlists/playlists.faker'
export * as sectionsMocks from './sections/sections.faker'
export * as sermonsMocks from './sermons/sermons.faker'
export * as usersMocks from './users/users.faker'

// Реэкспортируем все типы
export * as APITypes from './api.schemas'
