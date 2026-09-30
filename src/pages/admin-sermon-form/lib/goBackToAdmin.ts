import { router } from 'expo-router'

const SERMONS_LIST_ROUTE = '/admin/sermons'

/**
 * «Назад» для экранов проповедей (создание/деталь/редактирование) в стеке
 * `/admin`. Обычный `router.back()` может вынести из админки, если история
 * пуста (web-reload, deep link), поэтому без истории уходим на список
 * проповедей — экран, чья собственная кнопка «назад» не возвращается на
 * create, так что петля невозможна.
 */
export const goBackToAdmin = () => {
  if (router.canGoBack()) {
    router.back()
    return
  }

  router.replace(SERMONS_LIST_ROUTE)
}
