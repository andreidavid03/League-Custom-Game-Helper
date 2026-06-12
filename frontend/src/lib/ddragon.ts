/**
 * Riot Data Dragon client — free public CDN, no API key required.
 * Champion list is cached in localStorage per game version.
 */

export interface Champion {
  id: string // e.g. "MonkeyKing"
  name: string // e.g. "Wukong"
}

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json'
const CACHE_KEY = 'lol-cgh-champions'

let memoryCache: { version: string; champions: Champion[] } | null = null

export async function getChampions(): Promise<{ version: string; champions: Champion[] }> {
  if (memoryCache) return memoryCache

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const versions: string[] = await fetch(VERSIONS_URL).then((r) => r.json())
    const latest = versions[0]

    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed.version === latest) {
        memoryCache = parsed
        return parsed
      }
    }

    const data = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${latest}/data/en_US/champion.json`
    ).then((r) => r.json())

    const champions: Champion[] = Object.values(
      data.data as Record<string, { id: string; name: string }>
    ).map((c) => ({ id: c.id, name: c.name }))

    memoryCache = { version: latest, champions }
    localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache))
    return memoryCache
  } catch (err) {
    // Offline with no cache → caller shows a friendly message.
    const cached = typeof localStorage !== 'undefined' && localStorage.getItem(CACHE_KEY)
    if (cached) {
      memoryCache = JSON.parse(cached)
      return memoryCache!
    }
    throw new Error('Champion data needs an internet connection the first time.')
  }
}

export function championIconUrl(version: string, championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`
}

export function championSplashUrl(championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_0.jpg`
}
