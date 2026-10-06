import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRequireAdminRole } from 'entities/auth'
import { AdminContentSkeleton, EmptyState } from 'shared/ui'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { PressableButton } from 'shared/ui/pressable-button'
import { COLORS, useTheme } from 'shared/ui/theme'
import { INSTANCE_URL_PREFIX } from '../lib/instanceUrl'
import { useAddInstance } from '../lib/useAddInstance'
import { useInvidiousInstancesAdmin } from '../lib/useInvidiousInstancesAdmin'
import { InvidiousInstanceRow } from './InvidiousInstanceRow'
import { styles } from './styles'

const TITLE = 'Источники импорта'
const HINT = 'Invidious-инстансы, которые предлагаются при импорте проповеди.'
const INPUT_LABEL = 'Новый инстанс'
const ADD_LABEL = 'Добавить'
const SAVE_LABEL = 'Сохранить'
const DELETE_LABEL = 'Удалить'
const DELETE_TITLE = 'Удалить инстанс?'
const EMPTY_MESSAGE = 'Источников пока нет'
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить источники импорта'

// Управление админ-списком Invidious-инстансов: список приходит с бэкенда,
// добавление сразу сохраняется (после проверки API), удаление — локально до
// нажатия «Сохранить» (полная замена через PUT).
export const AdminInvidiousScreen = () => {
  useRequireAdminRole()
  const { currentTheme } = useTheme()
  const { addAndSave, instances, isDirty, isLoading, isSaving, loadFailed, removeUrl, save } =
    useInvidiousInstancesAdmin()
  const { draft, handleAdd, isValidating, setDraft } = useAddInstance({ addAndSave, instances })
  const [pendingRemoval, setPendingRemoval] = useState<null | string>(null)

  const handleConfirmRemoval = () => {
    if (pendingRemoval) removeUrl(pendingRemoval)
    setPendingRemoval(null)
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{TITLE}</Text>
        <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{HINT}</Text>
        <View style={styles.addRow}>
          <TextInput
            value={draft}
            keyboardType='url'
            autoCapitalize='none'
            onChangeText={setDraft}
            accessibilityLabel={INPUT_LABEL}
            placeholder={INSTANCE_URL_PREFIX}
            onSubmitEditing={() => void handleAdd()}
            placeholderTextColor={currentTheme.placeholder}
            style={[
              styles.input,
              { borderColor: currentTheme.textMuted, color: currentTheme.text },
            ]}
          />
          <PressableButton
            disabled={isValidating}
            onPress={() => void handleAdd()}
            style={[
              styles.addButton,
              { backgroundColor: currentTheme.primary },
              isValidating && styles.buttonDisabled,
            ]}
          >
            {isValidating ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.addButtonText}>{ADD_LABEL}</Text>
            )}
          </PressableButton>
        </View>

        {isLoading ? (
          <AdminContentSkeleton />
        ) : loadFailed ? (
          <Text style={[styles.error, { color: currentTheme.textMuted }]}>
            {LOAD_ERROR_MESSAGE}
          </Text>
        ) : instances.length === 0 ? (
          <EmptyState message={EMPTY_MESSAGE} />
        ) : (
          instances.map(url => (
            <InvidiousInstanceRow key={url} url={url} onRemove={() => setPendingRemoval(url)} />
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PressableButton
          onPress={() => void save()}
          disabled={!isDirty || isSaving}
          style={[
            styles.saveButton,
            { backgroundColor: currentTheme.primary },
            (!isDirty || isSaving) && styles.buttonDisabled,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>{SAVE_LABEL}</Text>
          )}
        </PressableButton>
      </View>

      <ConfirmDialog
        title={DELETE_TITLE}
        confirmText={DELETE_LABEL}
        onConfirm={handleConfirmRemoval}
        visible={pendingRemoval !== null}
        onCancel={() => setPendingRemoval(null)}
        message={pendingRemoval ? `Инстанс «${pendingRemoval}» будет удалён после сохранения.` : ''}
      />
    </SafeAreaView>
  )
}
