import { type OnboardingScenario } from '../scenarios'

export const studyScenario: OnboardingScenario = {
  description: 'Богословие и душепопечение',
  featureFlag: 'study',
  icon: 'school-outline',
  id: 'study',
  screens: ['/study'],
  steps: [
    {
      route: '/study',
      targetId: 'study.tabs',
      text: 'Переключайтесь между «Богословием» и «Душепопечением».',
      title: 'Разделы обучения',
    },
    {
      text: 'Выбирайте курс и проходите материалы по шагам.',
      title: 'Материалы',
    },
  ],
  title: 'Учиться',
}
