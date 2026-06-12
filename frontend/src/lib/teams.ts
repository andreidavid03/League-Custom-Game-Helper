import { Player, Role, ROLES, RANK_WEIGHTS, MatchPlayer } from './types'

/** Fisher-Yates shuffle (returns a new array). */
export function shuffle<T>(input: T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Split players randomly into two teams of equal size (extra player goes blue). */
export function splitRandom(players: Player[]): { blue: Player[]; red: Player[] } {
  const shuffled = shuffle(players)
  const half = Math.ceil(shuffled.length / 2)
  return { blue: shuffled.slice(0, half), red: shuffled.slice(half) }
}

/**
 * Build two teams with minimal rank-weight difference.
 * Tries many random partitions and keeps the best, then randomly
 * picks among near-optimal ones so results vary between runs.
 */
export function splitBalanced(players: Player[]): { blue: Player[]; red: Player[] } {
  const half = Math.ceil(players.length / 2)
  const weight = (team: Player[]) =>
    team.reduce((sum, p) => sum + RANK_WEIGHTS[p.rank], 0)

  let candidates: { blue: Player[]; red: Player[]; diff: number }[] = []
  const tries = Math.min(2000, 50 * players.length)
  for (let i = 0; i < tries; i++) {
    const shuffled = shuffle(players)
    const blue = shuffled.slice(0, half)
    const red = shuffled.slice(half)
    const diff = Math.abs(weight(blue) - weight(red))
    candidates.push({ blue, red, diff })
  }
  const best = Math.min(...candidates.map((c) => c.diff))
  candidates = candidates.filter((c) => c.diff <= best + 1)
  const chosen = pickRandom(candidates)
  return { blue: chosen.blue, red: chosen.red }
}

/**
 * Assign roles within one team. With `respectPreferences`, players are more
 * likely (not guaranteed) to land one of their preferred roles: preference
 * holders pick first from a shuffled role pool.
 * Teams larger/smaller than 5 just get roles for the first 5 players.
 */
export function assignRoles(
  team: Player[],
  respectPreferences: boolean
): Map<string, Role> {
  const result = new Map<string, Role>()
  const pool: Role[] = shuffle([...ROLES]).slice(0, Math.min(team.length, 5))

  let order = shuffle(team.slice(0, pool.length))
  if (respectPreferences) {
    // Players with preferences pick first so their roles are still available.
    order = [
      ...shuffle(order.filter((p) => p.preferredRoles.length > 0)),
      ...shuffle(order.filter((p) => p.preferredRoles.length === 0)),
    ]
  }

  const available = new Set<Role>(pool)
  for (const player of order) {
    let role: Role | undefined
    if (respectPreferences && player.preferredRoles.length > 0) {
      const wanted = shuffle(player.preferredRoles).find((r) => available.has(r))
      role = wanted
    }
    if (!role) role = pickRandom([...available])
    available.delete(role)
    result.set(player.id, role)
  }
  return result
}

/** Order players as match players, with optional roles. */
export function toMatchPlayers(
  team: Player[],
  roles?: Map<string, Role>,
  captainId?: string
): MatchPlayer[] {
  const roleIndex = (p: Player) =>
    roles?.get(p.id) ? ROLES.indexOf(roles.get(p.id)!) : 99
  return [...team]
    .sort((a, b) => roleIndex(a) - roleIndex(b))
    .map((p) => ({
      playerId: p.id,
      name: p.name,
      role: roles?.get(p.id),
      isCaptain: p.id === captainId || undefined,
    }))
}

/**
 * Snake draft pick order for `totalPicks` picks after captains are set.
 * Returns sides like B,R,R,B,B,R,R,B for fairness.
 */
export function snakeOrder(totalPicks: number, first: 'BLUE' | 'RED'): ('BLUE' | 'RED')[] {
  const second = first === 'BLUE' ? 'RED' : 'BLUE'
  const order: ('BLUE' | 'RED')[] = []
  let round = 0
  while (order.length < totalPicks) {
    const pair = round % 2 === 0 ? [first, second] : [second, first]
    order.push(pair[0] as 'BLUE' | 'RED', pair[1] as 'BLUE' | 'RED')
    round++
  }
  return order.slice(0, totalPicks)
}

/** Discord-ready text summary of the two teams. */
export function matchToText(blue: MatchPlayer[], red: MatchPlayer[]): string {
  const line = (p: MatchPlayer) =>
    `• ${p.isCaptain ? '👑 ' : ''}${p.name}` +
    (p.role ? ` — ${p.role}` : '') +
    (p.champion ? ` (${p.champion})` : '')
  return [
    '🔵 **BLUE TEAM**',
    ...blue.map(line),
    '',
    '🔴 **RED TEAM**',
    ...red.map(line),
    '',
    '⚔️ *made by David Demon — LoL Custom Game Helper*',
  ].join('\n')
}
