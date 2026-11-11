// Required build-time vars validated by src/shared/config/env.ts. Jest does not
// load .env — pin the prod values so URL-shape assertions hold.
process.env.EXPO_PUBLIC_BACKEND_API_HOSTNAME = 'api.slovo-propovedi.ru'
process.env.EXPO_PUBLIC_LANDING_HOSTNAME = 'slovo-propovedi.ru'
process.env.EXPO_PUBLIC_WEB_HOSTNAME = 'app.slovo-propovedi.ru'
process.env.EXPO_PUBLIC_REPOSITORY_URL = 'https://git.lightnode.ru'
process.env.EXPO_PUBLIC_REPOSITORY_OWNER = 'Slovo_Propovedi'
process.env.EXPO_PUBLIC_MIRROR_CODEBERG_URL = 'https://codeberg.org/Slovo_Propovedi'
process.env.EXPO_PUBLIC_MIRROR_GITHUB_URL = 'https://github.com/Slovo-Propovedi'
process.env.EXPO_PUBLIC_MOBILE_REPOSITORY_NAME = 'slovo-propovedi-mobile'

// Jest runs with __DEV__ === true, so debug.ts would enable the playlist-cache
// log channel in every suite. setupFiles run before the test module graph and
// modules capture the flag at import time, so turning it off here (at the
// source) keeps those log helpers no-ops without per-test mockConsole('log').
const { debugConfig } = require('../src/shared/config/debug')

debugConfig.enablePlaylistCacheLogs = false
