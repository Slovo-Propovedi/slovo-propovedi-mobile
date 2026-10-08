import { Checkbox } from 'expo-checkbox'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { CollapsibleGroup } from 'shared/ui/collapsible-group'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { folderLabel } from '../lib/fileIo'
import { AutosyncConflictDialog } from './AutosyncConflictDialog'
import { BackupImportModeDialog } from './BackupImportModeDialog'
import { styles } from './BackupSection.styles'
import { ServerUrlChangeDialog } from './ServerUrlChangeDialog'
import { useBackupSection } from './useBackupSection'

const UNAVAILABLE_FOLDER_LABEL = 'Папка недоступна — выберите заново'
const TITLE = 'Резервная копия'

export const BackupSection = () => {
  const { currentTheme } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const {
    applyPending,
    autosyncEnabled,
    cancelServerUrlChange,
    canFolderSync,
    canImportConflict,
    chooseFolder,
    confirmServerUrlChange,
    conflictVisible,
    dismissPending,
    exportBackup,
    exportFromPicker,
    folderUri,
    importBackup,
    importFromPicker,
    isDialogVisible,
    isFolderUsable,
    onDismissConflict,
    onImportMerge,
    onImportReplace,
    onOverwrite,
    pendingServerUrl,
    toggleAutosync,
  } = useBackupSection()

  const actionStyle = [styles.action, { borderColor: currentTheme.textMuted }]
  const actionTextStyle = [styles.actionText, { color: currentTheme.text }]
  const folderText = isFolderUsable ? folderLabel(folderUri) : UNAVAILABLE_FOLDER_LABEL
  const subtitle = canFolderSync ? folderText : undefined

  const handleExport = () => {
    void (canFolderSync ? exportBackup() : exportFromPicker())
  }
  const handleImport = () => {
    void (canFolderSync ? importBackup() : importFromPicker())
  }

  return (
    <>
      <CollapsibleGroup
        title={TITLE}
        subtitle={subtitle}
        expanded={expanded}
        icon='cloud-upload-outline'
        onToggle={() => setExpanded(previous => !previous)}
      >
        <View style={styles.actions}>
          {canFolderSync && (
            <TouchableItem style={actionStyle} onPress={() => void chooseFolder()}>
              <Text style={actionTextStyle}>
                {folderUri && isFolderUsable ? 'Сменить папку' : 'Выбрать папку'}
              </Text>
            </TouchableItem>
          )}
          <TouchableItem style={actionStyle} onPress={handleExport}>
            <Text style={actionTextStyle}>
              {canFolderSync ? 'Экспортировать' : 'Скачать копию'}
            </Text>
          </TouchableItem>
          <TouchableItem style={actionStyle} onPress={handleImport}>
            <Text style={actionTextStyle}>
              {canFolderSync ? 'Импортировать' : 'Загрузить из файла'}
            </Text>
          </TouchableItem>
        </View>
        {canFolderSync && (
          <View style={styles.autosyncRow}>
            <Text style={[styles.autosyncLabel, { color: currentTheme.text }]}>
              Автосинхронизация
            </Text>
            <Checkbox
              value={autosyncEnabled}
              aria-label='Автосинхронизация'
              onValueChange={toggleAutosync}
              disabled={!folderUri || !isFolderUsable}
              color={autosyncEnabled ? currentTheme.primary : undefined}
            />
          </View>
        )}
      </CollapsibleGroup>
      <BackupImportModeDialog
        visible={isDialogVisible}
        onDismiss={dismissPending}
        onMerge={() => void applyPending('merge')}
        onReplace={() => void applyPending('replace')}
      />
      <ServerUrlChangeDialog
        newUrl={pendingServerUrl ?? ''}
        onCancel={cancelServerUrlChange}
        visible={pendingServerUrl !== null}
        onConfirm={() => void confirmServerUrlChange()}
      />
      <AutosyncConflictDialog
        visible={conflictVisible}
        onOverwrite={onOverwrite}
        canImport={canImportConflict}
        onDismiss={onDismissConflict}
        onImportMerge={onImportMerge}
        onImportReplace={onImportReplace}
      />
    </>
  )
}
