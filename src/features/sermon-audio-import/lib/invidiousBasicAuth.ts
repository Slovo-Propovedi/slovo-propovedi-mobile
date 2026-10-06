// Инстансы за nginx basic auth вводят адресом `https://user:pass@host`. Fetch не
// любит креды в URL, поэтому выносим их в заголовок Authorization, а адрес запроса
// оставляем без userinfo; хост для текста ошибки берётся отдельно (URL.host).
export const parseInvidiousBasicAuth = (
  base: string,
): { authHeader: null | string; requestBase: string } => {
  const url = new URL(base)
  if (!url.username) return { authHeader: null, requestBase: base }

  const credentials = `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`
  url.username = ''
  url.password = ''

  const requestBase = url.toString().replace(/\/+$/, '')

  return { authHeader: `Basic ${btoa(credentials)}`, requestBase }
}
