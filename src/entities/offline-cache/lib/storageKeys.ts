// Ключи AsyncStorage, которыми владеет offline-cache (персистентный реестр
// офлайн-проповедей и флаг одноразового seed). Лежат в сущности, потому что
// кроме неё их читают только фичи; shared-слой их не использует.
export const OFFLINE_SERMONS_REGISTRY = 'offlineSermonsRegistry'
export const OFFLINE_SERMONS_REGISTRY_SEEDED = 'offlineSermonsRegistrySeeded'
