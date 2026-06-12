'use client'

import { useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Player, RANKS, Rank, ROLES, Role } from '@/lib/types'
import { Avatar, HexButton, HexPanel, Modal, SectionTitle, EmptyState, RankBadge, RolePill } from '@/components/ui'

/** Resize + center-crop an image file to a small square data URL. */
async function fileToAvatar(file: File, size = 128): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const side = Math.min(img.width, img.height)
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function PlayersTab() {
  const players = useAppStore((s) => s.players)
  const addPlayer = useAppStore((s) => s.addPlayer)
  const addPlayersBulk = useAppStore((s) => s.addPlayersBulk)
  const removePlayer = useAppStore((s) => s.removePlayer)

  const [name, setName] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState<string | null>(null)
  const [editing, setEditing] = useState<Player | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    if (!name.trim()) return
    const created = addPlayer(name)
    if (!created) {
      setError(`"${name.trim()}" is already on the roster.`)
      return
    }
    setError(null)
    setName('')
  }

  const handleBulkAdd = () => {
    const names = bulkText
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter(Boolean)
    const added = addPlayersBulk(names)
    setBulkResult(`Added ${added} player${added === 1 ? '' : 's'}${
      added < names.length ? ` (${names.length - added} duplicates skipped)` : ''
    }.`)
    setBulkText('')
  }

  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="animate-float-up">
      <SectionTitle sub="Build the roster once — pick who's playing each game night.">
        The Roster
      </SectionTitle>

      {/* Add player */}
      <HexPanel className="p-4 mb-6 max-w-2xl mx-auto">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Summoner name…"
            className="flex-1 bg-abyss/60 border border-gold-dark/50 focus:border-gold outline-none px-3 py-2 text-gold-light placeholder:text-gold-light/30"
          />
          <HexButton onClick={handleAdd} disabled={!name.trim()}>
            Add
          </HexButton>
          <HexButton variant="ghost" onClick={() => { setBulkOpen(true); setBulkResult(null) }}>
            Bulk
          </HexButton>
        </div>
        {error && <p className="text-team-red text-sm mt-2">{error}</p>}
      </HexPanel>

      {/* Roster list */}
      {sorted.length === 0 ? (
        <EmptyState
          icon="🧙"
          title="No summoners yet"
          hint="Add your friends above — name is enough to start. Rank and preferred roles make Balanced Teams and role assignment smarter."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((p) => (
            <HexPanel key={p.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-center gap-2.5">
                  <Avatar name={p.name} src={p.avatarUrl} size={36} />
                  <div className="min-w-0">
                    <p className="font-semibold text-gold-light truncate">{p.name}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <RankBadge rank={p.rank} />
                      {p.preferredRoles.map((r) => (
                        <RolePill key={r} role={r} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(p)}
                    className="text-gold-light/40 hover:text-gold px-1.5 py-0.5"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => removePlayer(p.id)}
                    className="text-gold-light/40 hover:text-team-red px-1.5 py-0.5"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </HexPanel>
          ))}
        </div>
      )}

      <p className="text-center text-gold-light/30 text-sm mt-6">
        {players.length} summoner{players.length === 1 ? '' : 's'} on the roster
      </p>

      {/* Bulk add modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Add Players">
        <p className="text-sm text-gold-light/60 mb-3">
          Paste names separated by commas or new lines — e.g. straight from your Discord lobby.
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={6}
          placeholder={'Faker\nCaps, Rekkles\nBwipo'}
          className="w-full bg-abyss/60 border border-gold-dark/50 focus:border-gold outline-none px-3 py-2 text-gold-light placeholder:text-gold-light/30"
        />
        {bulkResult && <p className="text-teal text-sm mt-2">{bulkResult}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <HexButton variant="ghost" onClick={() => setBulkOpen(false)}>
            Close
          </HexButton>
          <HexButton onClick={handleBulkAdd} disabled={!bulkText.trim()}>
            Add All
          </HexButton>
        </div>
      </Modal>

      {/* Edit modal */}
      {editing && <EditPlayerModal player={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function EditPlayerModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const updatePlayer = useAppStore((s) => s.updatePlayer)
  const [name, setName] = useState(player.name)
  const [rank, setRank] = useState<Rank>(player.rank)
  const [roles, setRoles] = useState<Role[]>(player.preferredRoles)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(player.avatarUrl)
  const photoRef = useRef<HTMLInputElement>(null)

  const toggleRole = (role: Role) =>
    setRoles((rs) => (rs.includes(role) ? rs.filter((r) => r !== role) : [...rs, role]))

  const save = () => {
    updatePlayer(player.id, { name: name.trim() || player.name, rank, preferredRoles: roles, avatarUrl })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={`Edit ${player.name}`}>
      <div className="flex items-center gap-4 mb-5">
        <Avatar name={name || player.name} src={avatarUrl} size={64} />
        <div className="flex flex-col gap-1.5">
          <HexButton variant="ghost" onClick={() => photoRef.current?.click()}>
            📷 {avatarUrl ? 'Change photo' : 'Add photo'}
          </HexButton>
          {avatarUrl && (
            <HexButton variant="danger" onClick={() => setAvatarUrl(undefined)}>
              Remove photo
            </HexButton>
          )}
        </div>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) setAvatarUrl(await fileToAvatar(f))
            e.target.value = ''
          }}
        />
      </div>

      <label className="block text-xs uppercase tracking-wider text-gold-light/50 mb-1">Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-abyss/60 border border-gold-dark/50 focus:border-gold outline-none px-3 py-2 text-gold-light mb-4"
      />

      <label className="block text-xs uppercase tracking-wider text-gold-light/50 mb-1">
        Rank <span className="normal-case">(used by Balanced Teams)</span>
      </label>
      <select
        value={rank}
        onChange={(e) => setRank(e.target.value as Rank)}
        className="w-full bg-abyss/60 border border-gold-dark/50 focus:border-gold outline-none px-3 py-2 text-gold-light mb-4"
      >
        {RANKS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label className="block text-xs uppercase tracking-wider text-gold-light/50 mb-2">
        Preferred roles <span className="normal-case">(more likely to get them)</span>
      </label>
      <div className="flex flex-wrap gap-2 mb-6">
        {ROLES.map((r) => (
          <button key={r} onClick={() => toggleRole(r)}>
            <RolePill role={r} active={roles.includes(r)} />
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <HexButton variant="ghost" onClick={onClose}>
          Cancel
        </HexButton>
        <HexButton onClick={save}>Save</HexButton>
      </div>
    </Modal>
  )
}
