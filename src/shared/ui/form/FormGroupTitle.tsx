import { type StyleProp, Text, type TextStyle } from 'react-native'
import { RequiredAsterisk } from './RequiredAsterisk'

// Заголовок группы полей формы. Может нести красную звёздочку, если вся
// группа обязательна (для отдельных обязательных полей звёздочку даёт FormField).
export const FormGroupTitle = ({
  children,
  required = false,
  style,
}: {
  children: string
  required?: boolean
  style?: StyleProp<TextStyle>
}) => (
  <Text style={style}>
    {children}
    {required ? <RequiredAsterisk /> : null}
  </Text>
)
