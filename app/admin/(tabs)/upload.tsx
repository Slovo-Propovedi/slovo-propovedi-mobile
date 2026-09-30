import { Redirect } from 'expo-router'

// Таб «Загрузить» — короткий путь к созданию проповеди: форма загрузки живёт
// отдельным экраном /admin/sermons/create (см. docs/features/admin.md).
const UploadTab = () => <Redirect href='/admin/sermons/create' />

export default UploadTab
