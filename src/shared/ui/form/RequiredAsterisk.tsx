import { Text } from 'react-native'
import { COLORS } from '../theme/colors'

// Красная звёздочка у обязательного поля/заголовка группы. Живёт вложенным
// Text, чтобы стоять вплотную к подписи и не ломать её перенос.
export const RequiredAsterisk = () => <Text style={{ color: COLORS.error }}>*</Text>
