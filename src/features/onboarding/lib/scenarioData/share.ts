import { type OnboardingScenario } from '../scenarios'

export const shareScenario: OnboardingScenario = {
  description: 'QR-код и ссылка',
  globalFallback: true,
  icon: 'qr-code-outline',
  id: 'share',
  screens: ['/more', '/share'],
  steps: [
    {
      // Foreign-start intro: names the tab tap and the destination. A same-screen
      // start from «Ещё» skips it (the screen-local intro below lands instead).
      text: 'Сейчас перейдём на экран «Ещё» — тапнем по нему — и откроем страницу «Поделиться приложением». Нажмите «Далее».',
      title: 'Поделиться приложением',
    },
    {
      // The «Ещё» tab is an entry transition (blink + navigation): it navigates from
      // any screen and blinks while the route is not reached, auto-skipping when
      // already on «Ещё».
      route: '/more',
      tapTargetId: 'tab.more',
    },
    {
      // Screen-local intro: a same-screen start from «Ещё» lands here (the routeless
      // foreign-start intro and the tab entry above are skipped), so this card explains
      // the «Поделиться приложением» tap itself. Routeless — inherits «/more» from the
      // tab entry above.
      text: 'Откроем страницу «Поделиться приложением»: тапнем по одноимённому пункту в этом списке. Нажмите «Далее».',
      title: 'Поделиться приложением',
    },
    {
      route: '/share',
      tapTargetId: 'more.share-item',
    },
    {
      route: '/share',
      targetId: 'share.qr',
      text: 'Покажите код с телефона получателя — откроется сайт, где можно скачать приложение или открыть веб-версию.',
      title: 'QR-код',
    },
    {
      targetId: 'share.copy',
      text: 'Кнопка копирует ссылку вместе с описанием приложения — можно сразу пересылать в мессенджер.',
      title: 'Скопировать ссылку',
    },
    {
      skipIfMissing: true,
      targetId: 'share.send',
      text: 'Если на устройстве есть системное меню «Поделиться», этой кнопкой можно сразу отправить ссылку — выберите приложение и получателя.',
      title: 'Поделиться ссылкой',
    },
    {
      text: 'Сайт из трёх разделов: сайт проекта, веб-версия для браузера и последняя сборка приложения для Android.',
      title: 'Что откроется по ссылке',
    },
  ],
  title: 'Поделиться приложением',
}
