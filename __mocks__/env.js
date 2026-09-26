// Required build-time vars validated by src/shared/config/env.ts. Jest does not
// load .env — pin the prod values so URL-shape assertions hold.
process.env.EXPO_PUBLIC_BACKEND_API_HOSTNAME = 'api.slovo-propovedi.ru'
process.env.EXPO_PUBLIC_LANDING_HOSTNAME = 'slovo-propovedi.ru'
process.env.EXPO_PUBLIC_WEB_HOSTNAME = 'app.slovo-propovedi.ru'
