// Required build-time vars validated by src/shared/config/env.ts. Jest does not
// load .env — pin the prod values so URL-shape assertions hold.
process.env.EXPO_PUBLIC_BACKEND_API_HOSTNAME = 'api.slovo-propovedi.ru'
process.env.EXPO_PUBLIC_LANDING_HOSTNAME = 'slovo-propovedi.ru'
process.env.EXPO_PUBLIC_WEB_HOSTNAME = 'app.slovo-propovedi.ru'
process.env.EXPO_PUBLIC_REPOSITORY_URL = 'https://git.lightnode.ru'
process.env.EXPO_PUBLIC_REPOSITORY_ORG = 'Slovo_Propovedi'
process.env.EXPO_PUBLIC_MIRROR_CODEBERG_URL = 'https://codeberg.org'
process.env.EXPO_PUBLIC_MIRROR_CODEBERG_ORG = 'Slovo_Propovedi'
process.env.EXPO_PUBLIC_MIRROR_GITHUB_ORG = 'Slovo-Propovedi'
process.env.EXPO_PUBLIC_MOBILE_REPOSITORY_NAME = 'slovo-propovedi-mobile'
