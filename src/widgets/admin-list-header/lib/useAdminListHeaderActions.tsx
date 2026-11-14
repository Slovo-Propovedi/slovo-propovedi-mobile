import Ionicons from '@expo/vector-icons/Ionicons'
import { type ComponentProps, useCallback, useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { RefreshButton, RefreshContext } from 'shared/ui'
import { IconButton } from 'shared/ui/icon-button'
import { INDENTS, useTheme } from 'shared/ui/theme'

const ICON_SIZE = 24

/**
 * Опции шапки списочного экрана админки: «обновить» (нужен только веб-десктопу —
 * на нативе кнопка сама скрывается) и основная иконка действия справа
 * («Создать…», «Загрузить файл»). Экран рендерит их сам через `Stack.Screen`,
 * как и детальные экраны через `useAdminDetailHeader`.
 *
 * Свежие обработчики держим в ref (синхронизация в эффекте, не во время рендера):
 * callers передают inline-стрелки, а `headerRight` должен сохранять идентичность
 * между рендерами, иначе expo-router переустанавливает options каждый рендер и
 * уходит в «Maximum update depth exceeded». В зависимости `useMemo` входят только
 * стабильные значения и дискретные флаги (`isRefreshing`, `isActionDisabled`) —
 * та же дисциплина, что у `SaveButton` с `isDirty` в `useAdminFormHeader`.
 *
 * `RefreshContext` задаётся здесь явно: шапка живёт вне `PullToRefresh` тела
 * экрана, поэтому без провайдера `RefreshButton` не нашёл бы обработчик и на web
 * не отрисовался бы вовсе.
 * @param options - Параметры действий шапки списка.
 * @param options.icon - Иконка основного действия.
 * @param options.isActionDisabled - Основное действие недоступно (например, идёт загрузка).
 * @param options.isRefreshing - Идёт ли обновление списка (спиннер вместо «обновить»).
 * @param options.label - Accessibility-подпись основного действия.
 * @param options.onAction - Обработчик основного действия.
 * @param options.onRefresh - Перезагрузка списка для веб-кнопки «Обновить».
 */
export const useAdminListHeaderActions = ({
  icon,
  isActionDisabled = false,
  isRefreshing,
  label,
  onAction,
  onRefresh,
}: {
  icon: ComponentProps<typeof Ionicons>['name']
  isActionDisabled?: boolean
  isRefreshing: boolean
  label: string
  onAction: () => void
  onRefresh: () => Promise<void> | void
}) => {
  const { currentTheme } = useTheme()
  const onActionRef = useRef(onAction)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    onActionRef.current = onAction
    onRefreshRef.current = onRefresh
  })

  const handleAction = useCallback(() => onActionRef.current(), [])
  const handleRefresh = useCallback(() => onRefreshRef.current(), [])

  const refreshContext = useMemo(
    () => ({ onRefresh: handleRefresh, refreshing: isRefreshing }),
    [handleRefresh, isRefreshing],
  )

  const headerRight = useMemo(
    () => () => (
      <RefreshContext.Provider value={refreshContext}>
        <View style={styles.row}>
          <RefreshButton />
          <IconButton
            onPress={handleAction}
            accessibilityLabel={label}
            disabled={isActionDisabled}
            Icon={
              <Ionicons
                name={icon}
                size={ICON_SIZE}
                color={isActionDisabled ? currentTheme.textMuted : currentTheme.primary}
              />
            }
          />
        </View>
      </RefreshContext.Provider>
    ),
    [
      currentTheme.primary,
      currentTheme.textMuted,
      handleAction,
      isActionDisabled,
      icon,
      label,
      refreshContext,
    ],
  )

  return useMemo(() => ({ headerRight }), [headerRight])
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
  },
})
