export const applyWebUpdate = async (): Promise<void> => {
  const container = navigator.serviceWorker
  const registration = await container.ready
  const waiting = registration.waiting

  // Уже активировано в другом табе — controllerchange там уже произошёл,
  // обычная перезагрузка подхватит новый билд.
  if (!waiting) {
    window.location.reload()
    return
  }

  let reloading = false
  const handleControllerChange = () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  }

  container.addEventListener('controllerchange', handleControllerChange, { once: true })
  waiting.postMessage({ type: 'SKIP_WAITING' })
}
