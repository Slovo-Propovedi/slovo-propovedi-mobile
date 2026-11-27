import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { INDENTS } from 'shared/ui/theme'
import { type ScenarioScope } from '../lib/scenarios'
import { onboardingTourAtom } from '../model/tour'
import { ScenarioPickerModal } from './ScenarioPickerModal'

const SCREEN_GROUP_TITLE = 'На этом экране'
const GLOBAL_GROUP_TITLE = 'Глобальные'
const PLAYER_GROUP_TITLE = 'Плеер'

const mockPathname = jest.fn(() => '/listen')
const mockIsWideLayout = jest.fn(() => true)

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname(),
}))

jest.mock('shared/ui/layout', () => ({ useIsWideLayout: () => mockIsWideLayout() }))

jest.mock('entities/feature-flags', () => ({
  useFeatureFlag: () => true,
}))

const renderPicker = (scope?: ScenarioScope) =>
  renderWithProviders(<ScenarioPickerModal visible scope={scope} onClose={jest.fn()} />)

// Rows render in document order: the screen group first, then the global one.
const expectRowTitles = (titles: string[]) => {
  const rows = screen.getAllByRole('button')

  expect(rows).toHaveLength(titles.length)
  titles.forEach((title, index) => {
    expect(rows[index]).toHaveTextContent(title, { exact: false })
  })
}

describe('<ScenarioPickerModal>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname.mockReturnValue('/listen')
    mockIsWideLayout.mockReturnValue(true)
  })

  test('offers the whats-new tour in the wide layout', async () => {
    await renderPicker()

    expect(screen.getByText('Что нового')).toBeTruthy()
  })

  test('hides the whats-new tour in the compact layout', async () => {
    mockIsWideLayout.mockReturnValue(false)

    await renderPicker()

    expect(screen.queryByText('Что нового')).toBeNull()
    expect(screen.getByText('Добро пожаловать')).toBeTruthy()
  })

  test('splits scenarios into screen and global groups on /listen', async () => {
    await renderPicker()

    expect(screen.getByText(SCREEN_GROUP_TITLE)).toBeTruthy()
    expect(screen.getByText(GLOBAL_GROUP_TITLE)).toBeTruthy()
    expectRowTitles([
      'Как слушать проповеди',
      'Плеер',
      'Плейлисты',
      'Результаты поиска',
      'Резервное копирование',
      'Поделиться приложением',
      'Добро пожаловать',
      'Что нового',
    ])
  })

  test('keeps the five playlist tours local on the playlist screen', async () => {
    mockPathname.mockReturnValue('/listen/playlist')

    await renderPicker()

    expectRowTitles([
      'Экран плейлиста',
      'Добавление в плейлист',
      'Избранное',
      'Прослушивание без интернета',
      'Поделиться плейлистом',
      'Результаты поиска',
      'Резервное копирование',
      'Поделиться приложением',
      'Добро пожаловать',
      'Что нового',
    ])
  })

  test('groups backup with settings locally on the settings screen while share stays global', async () => {
    mockPathname.mockReturnValue('/settings')

    await renderPicker()

    expectRowTitles([
      'Настройки и резервные копии',
      'Резервное копирование',
      'Результаты поиска',
      'Поделиться приложением',
      'Добро пожаловать',
      'Что нового',
    ])
  })

  test('starts a screen tour on the current screen, skipping the lead-up', async () => {
    mockPathname.mockReturnValue('/settings')
    const { ctx, getByRole } = await renderPicker()

    await fireEvent.press(getByRole('button', { name: /Настройки и резервные копии/ }))

    expect(ctx.get(onboardingTourAtom)).toEqual({
      deckIndex: 1,
      scenarioId: 'settings',
      skippedDeckIndexes: [0],
    })
  })

  test('shows the share scenario local on the share screen while backup stays global', async () => {
    mockPathname.mockReturnValue('/share')

    await renderPicker()

    expect(screen.getByText(SCREEN_GROUP_TITLE)).toBeTruthy()
    expect(screen.getByText(GLOBAL_GROUP_TITLE)).toBeTruthy()
    expectRowTitles([
      'Поделиться приложением',
      'Результаты поиска',
      'Резервное копирование',
      'Добро пожаловать',
      'Что нового',
    ])
  })

  test('shows the More screen scenarios, backup and share local on /more', async () => {
    mockPathname.mockReturnValue('/more')

    await renderPicker()

    expectRowTitles([
      'История прослушивания',
      'Офлайн-режим',
      'Настройки и резервные копии',
      'Резервное копирование',
      'Поделиться приложением',
      'Результаты поиска',
      'Добро пожаловать',
      'Что нового',
    ])
  })

  test('skips the screen group when no scenario matches the route', async () => {
    mockPathname.mockReturnValue('/about')

    await renderPicker()

    expect(screen.queryByText(SCREEN_GROUP_TITLE)).toBeNull()
    expect(screen.getByText(GLOBAL_GROUP_TITLE)).toBeTruthy()
  })

  test('bounds the scroll area and pads the last row above the system nav bar', async () => {
    await renderPicker()

    const scroll = screen.getByTestId('scenario-picker-scroll')

    expect(StyleSheet.flatten(scroll.props.contentContainerStyle)).toMatchObject({
      paddingBottom: INDENTS.low,
    })
  })

  test('player scope shows the player tours plus the global scenarios', async () => {
    await renderPicker('player')

    expect(screen.queryByText(SCREEN_GROUP_TITLE)).toBeNull()
    expect(screen.getByText(PLAYER_GROUP_TITLE)).toBeTruthy()
    expect(screen.getByText(GLOBAL_GROUP_TITLE)).toBeTruthy()
    expectRowTitles([
      'Экран плеера',
      'Подробнее и таймкоды',
      'Скорость прослушивания',
      'Настройка звука',
      'Избранное и плейлисты',
      'Результаты поиска',
      'Резервное копирование',
      'Поделиться приложением',
      'Добро пожаловать',
      'Что нового',
    ])
  })
})
