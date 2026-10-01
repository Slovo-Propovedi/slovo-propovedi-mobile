import { createContext, useContext } from 'react'

// Обработчик отправки формы, который `FormScrollView` публикует для своих полей.
// `null` — форма без Enter-отправки (провайдер не установлен): поля ведут себя
// как раньше.
export const FormSubmitContext = createContext<(() => void) | null>(null)

// Возвращает обработчик отправки формы по Enter или `null` вне провайдера.
export const useFormSubmit = () => useContext(FormSubmitContext)
