import { http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'
import type { APITypes } from 'shared/api/generated'
import { localDB } from './localBD'

// Создаем MSW worker
export const worker = setupWorker()

// Auth endpoints
worker.use(
  http.post('/auth/login', async () =>
    HttpResponse.json<APITypes.AuthResponse>({
      accessToken: 'mock-access-token',
      user: {
        email: 'mock@example.com',
        id: 'mock-user-id',
        name: 'Mock User',
      },
    }),
  ),

  http.get('/auth/profile', async () =>
    HttpResponse.json<APITypes.UserEntity>({
      email: 'mock@example.com',
      id: 'mock-user-id',
      name: 'Mock User',
    }),
  ),
)

// Sermons endpoints
worker.use(
  http.get('/sermons', async () => {
    const allSermons = localDB.getBooks().flatMap(group => group.books)

    return HttpResponse.json({
      count: allSermons.length,
      sermons: allSermons as unknown as APITypes.SermonEntity[],
    })
  }),

  http.get('/sermons/:id', async ({ params }) => {
    const { id } = params
    const sermon = localDB
      .getBooks()
      .flatMap(group => group.books)
      .find(s => s.id === id)

    if (!sermon) return new HttpResponse(null, { status: 404 })

    return HttpResponse.json(sermon as unknown as APITypes.SermonEntity)
  }),
)

// Playlists endpoints
worker.use(
  http.get('/playlists', async () => {
    const allPlaylists = localDB.getSermons().flatMap(group => group.playlists)

    return HttpResponse.json({
      count: allPlaylists.length,
      playlists: allPlaylists as unknown as APITypes.PlaylistEntity[],
    })
  }),

  http.get('/playlists/:id', async ({ params }) => {
    const { id } = params
    const playlist = localDB
      .getSermons()
      .flatMap(group => group.playlists)
      .find(p => p.id === id)

    if (!playlist) return new HttpResponse(null, { status: 404 })

    return HttpResponse.json(playlist as unknown as APITypes.PlaylistEntity)
  }),
)

// Sections endpoints
worker.use(
  http.get('/section', async () =>
    HttpResponse.json({
      count: 0,
      sections: [],
    }),
  ),

  http.get('/section/:id', async () => new HttpResponse(null, { status: 404 })),
)

// Запуск worker (только для web)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') void worker.start()
