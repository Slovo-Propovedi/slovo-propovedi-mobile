import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, type Ctx } from '@reatom/framework'
import { removeHistoryEntryAction } from 'entities/listening-history/@x/player'
import { CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_SOUND_POSITION } from 'shared/config'
import { setBarCollapsed } from 'shared/ui/layout'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  durationAtom,
  isBufferingAtom,
  isPlayingAtom,
  positionAtom,
} from './model'
import { isPlayerExpandedAtom } from './playerSheet'

/**
 * Сбрасывает сохранённое состояние плеера и «забывает» текущую проповедь:
 * удаляет storage-ключи (текущее аудио/плейлист/позицию) — после этого холодный
 * старт их не восстановит, — обнуляет активные состояния (миниплеер и
 * полноэкранный плеер скрываются, очередь пустеет) и удаляет запись загруженной
 * проповеди из истории прослушивания. Сброс также сворачивает полноэкранный
 * плеер (`isPlayerExpandedAtom`), иначе развёрнутое состояние переживёт сброс и
 * следующий запуск откроет плеер сразу на полный экран. По той же причине сброс
 * разворачивает нижнюю строку (`setBarCollapsed(false)`): после обнуления
 * `currentAudioAtom` мини-плеер исчезает, и свёрнутая строка оставила бы мёртвый
 * зазор, который нечем развернуть — скролл-драйвер приостановлен без активной
 * проповеди. Карточка «Продолжить»
 * на экране «Слушать» исчезает и больше не предлагает удалённую проповедь;
 * флеш-воссоздание невозможно: снятие `currentAudioAtom` останавливает 10с-флаш
 * прогресса (гейт на audio), а удалённая запись защищена тамбстоуном от
 * in-flight flush'а. Id текущей проповеди читается до обнуления атома.
 * @param ctx - Reatom-контекст.
 */
export const resetPlayerState = async (ctx: Ctx): Promise<void> => {
  const removedSermonId = ctx.get(currentAudioAtom)?.id

  await AsyncStorage.multiRemove([CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_SOUND_POSITION])
  await ctx.schedule(() => {
    currentAudioAtom(ctx, null)
    currentPlaylistAtom(ctx, null)
    isPlayingAtom(ctx, false)
    positionAtom(ctx, 0)
    durationAtom(ctx, 0)
    isBufferingAtom(ctx, false)
    isPlayerExpandedAtom(ctx, false)
    setBarCollapsed(ctx, false)
  })
  if (removedSermonId) void removeHistoryEntryAction(ctx, removedSermonId)
}

/**
 * Полностью закрывает плеер: освобождает нативный игрок (`unload` убирает
 * нотификейшн-бар нативно) и сбрасывает состояние и историю через
 * `resetPlayerState`.
 *
 * Отказ `unload` логируется, но UI всё равно закрывается: очистка состояний
 * должна пройти независимо от нативной ошибки.
 *
 * `playerService` грузится динамически: этот модуль переэкспортируется в
 * `entities/playlist` (`@x/playlist`), и статический импорт затягивал бы
 * `expo-audio` в граф каждой сущности/теста, которые лишь импортируют
 * `entities/playlist` (тот же приём, что в `ensureNotifications`).
 */
export const resetPlaybackAction = action(async ctx => {
  const { playerService } = await import('./lib/PlayerService')
  try {
    await playerService.unload()
  } catch (error) {
    console.error('[player] unload failed:', error)
  }
  await resetPlayerState(ctx)
}, 'resetPlayback')
