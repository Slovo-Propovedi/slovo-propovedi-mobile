// Импортируем все сгенерированные функции из Orval
export * as authApi from './auth/auth'
export * as featureFlagsApi from './feature-flags/feature-flags'
export * as filesApi from './files/files'
export * as invidiousApi from './invidious/invidious'
export * as playlistsApi from './playlists/playlists'
export * as sectionsApi from './sections/sections'
export * as sermonsApi from './sermons/sermons'
export * as usersApi from './users/users'

export * as authMocks from './auth/auth.faker'
export * as featureFlagsMocks from './feature-flags/feature-flags.faker'
export * as filesMocks from './files/files.faker'
export * as invidiousMocks from './invidious/invidious.faker'
export * as playlistsMocks from './playlists/playlists.faker'
export * as sectionsMocks from './sections/sections.faker'
export * as sermonsMocks from './sermons/sermons.faker'
export * as usersMocks from './users/users.faker'

// Zod-схемы ответов — для валидации кеша на границе чтения
export * as featureFlagsSchemas from './model/feature-flags'
export * as filesSchemas from './model/files'
export * as playlistsSchemas from './model/playlists'
export * as sectionsSchemas from './model/sections'
export * as sermonsSchemas from './model/sermons'
export * as usersSchemas from './model/users'

// Реэкспортируем все типы
export * as APITypes from './api.schemas'
