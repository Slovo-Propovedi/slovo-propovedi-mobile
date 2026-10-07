import { renderWithProviders } from '../../mocks/renderWithProviders'
import { DropOverlay } from './DropOverlay'

const ENTRIES = [
  { active: true, description: 'Изображение → обложка' },
  { active: false, description: 'Текст → текстовый файл' },
]

describe('<DropOverlay>', () => {
  test('renders nothing while hidden', async () => {
    const { queryByText } = await renderWithProviders(
      <DropOverlay visible={false} entries={ENTRIES} />,
    )

    expect(queryByText('Отпустите, чтобы прикрепить файл')).toBeNull()
  })

  test('renders each entry and marks predicted kinds as selected', async () => {
    const { getByLabelText, getByText } = await renderWithProviders(
      <DropOverlay visible entries={ENTRIES} />,
    )

    expect(getByText('Отпустите, чтобы прикрепить файл')).toBeTruthy()
    expect(getByLabelText('Изображение → обложка')).toBeSelected()
    expect(getByLabelText('Текст → текстовый файл')).not.toBeSelected()
  })
})
