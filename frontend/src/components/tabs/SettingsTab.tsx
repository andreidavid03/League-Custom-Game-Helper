'use client'

import { useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { THEMES, THEME_LABELS, THEME_SWATCHES } from '@/lib/types'
import { HexButton, HexPanel, Modal, SectionTitle } from '@/components/ui'

export default function SettingsTab() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const exportData = useAppStore((s) => s.exportData)
  const importData = useAppStore((s) => s.importData)
  const players = useAppStore((s) => s.players)
  const matches = useAppStore((s) => s.matches)

  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lol-custom-games-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ ok: true, text: 'Backup downloaded.' })
  }

  const handleImport = async (file: File) => {
    const text = await file.text()
    const result = importData(text)
    setMessage(
      result.ok
        ? { ok: true, text: 'Data imported — roster, history and settings restored.' }
        : { ok: false, text: result.error || 'Import failed.' }
    )
  }

  const wipeAll = () => {
    importData(JSON.stringify({ players: [], matches: [], settings: {} }))
    setConfirmWipe(false)
    setMessage({ ok: true, text: 'All data wiped. Fresh start!' })
  }

  return (
    <div className="animate-float-up max-w-2xl mx-auto">
      <SectionTitle sub="Sounds, pacing, and your data.">Settings</SectionTitle>

      <HexPanel className="p-5 mb-4">
        <h3 className="font-display text-gold uppercase tracking-wider text-sm mb-3">Theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {THEMES.map((t) => {
            const [bg, accent, accent2] = THEME_SWATCHES[t]
            const active = (settings.theme || 'HEXTECH') === t
            return (
              <button
                key={t}
                onClick={() => updateSettings({ theme: t })}
                className={`rounded-xl border p-3 text-center transition-all duration-150 hover:-translate-y-0.5 ${
                  active
                    ? 'border-gold shadow-[0_0_16px_color-mix(in_srgb,var(--c-accent)_35%,transparent)]'
                    : 'border-gold-dark/40 opacity-70 hover:opacity-100'
                }`}
                style={{ background: bg }}
              >
                <span className="flex justify-center gap-1.5 mb-2">
                  <span className="w-4 h-4 rounded-full" style={{ background: accent }} />
                  <span className="w-4 h-4 rounded-full" style={{ background: accent2 }} />
                </span>
                <span className="text-[11px] tracking-wide font-medium" style={{ color: accent }}>
                  {THEME_LABELS[t]}
                </span>
              </button>
            )
          })}
        </div>
      </HexPanel>

      <HexPanel className="p-5 mb-4">
        <h3 className="font-display text-gold uppercase tracking-wider text-sm mb-3">Experience</h3>

        <SettingRow
          label="Sound effects"
          hint="Wheel ticks, lock-ins, fanfares, the case-opening sound"
        >
          <Toggle value={settings.soundOn} onChange={(v) => updateSettings({ soundOn: v })} />
        </SettingRow>

        <SettingRow label="Animation pace" hint="How long the rituals build suspense">
          <div className="flex gap-1">
            {[
              { v: 0.5, label: 'Dramatic' },
              { v: 1, label: 'Normal' },
              { v: 2, label: 'Snappy' },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => updateSettings({ animationSpeed: opt.v })}
                className={`text-xs px-3 py-1.5 border transition-colors ${
                  settings.animationSpeed === opt.v
                    ? 'border-gold text-gold bg-gold/10'
                    : 'border-gold-dark/40 text-gold-light/50 hover:text-gold-light'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow
          label="Respect preferred roles"
          hint="Role assignment favours each player's preferred roles when possible"
        >
          <Toggle
            value={settings.respectPreferredRoles}
            onChange={(v) => updateSettings({ respectPreferredRoles: v })}
          />
        </SettingRow>
      </HexPanel>

      <HexPanel className="p-5 mb-4">
        <h3 className="font-display text-gold uppercase tracking-wider text-sm mb-1">Your data</h3>
        <p className="text-xs text-gold-light/40 mb-4">
          Everything lives on this device: {players.length} players, {matches.length} matches.
          Export a backup before switching browsers or devices.
        </p>
        <div className="flex flex-wrap gap-2">
          <HexButton onClick={handleExport}>⬇️ Export backup</HexButton>
          <HexButton variant="ghost" onClick={() => fileRef.current?.click()}>
            ⬆️ Import backup
          </HexButton>
          <HexButton variant="danger" onClick={() => setConfirmWipe(true)}>
            Wipe all data
          </HexButton>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleImport(f)
            e.target.value = ''
          }}
        />
        {message && (
          <p className={`text-sm mt-3 ${message.ok ? 'text-teal' : 'text-team-red'}`}>
            {message.text}
          </p>
        )}
      </HexPanel>

      <HexPanel className="p-5">
        <h3 className="font-display text-gold uppercase tracking-wider text-sm mb-1">About</h3>
        <p className="text-xs text-gold-light/40 leading-relaxed">
          LoL Custom Game Helper v2 · made by David Demon for game nights with friends.
          Works offline as an installable app — on mobile, use your browser&apos;s
          &quot;Add to Home Screen&quot;. Champion data courtesy of Riot&apos;s Data Dragon.
          League of Legends is a trademark of Riot Games — this is a fan project.
        </p>
      </HexPanel>

      <Modal open={confirmWipe} onClose={() => setConfirmWipe(false)} title="Wipe All Data">
        <p className="text-sm text-gold-light/70 mb-6">
          This deletes the entire roster, all match history and settings from this device.
          There is no undo — export a backup first if in doubt.
        </p>
        <div className="flex justify-end gap-2">
          <HexButton variant="ghost" onClick={() => setConfirmWipe(false)}>
            Cancel
          </HexButton>
          <HexButton variant="danger" onClick={wipeAll}>
            Wipe everything
          </HexButton>
        </div>
      </Modal>
    </div>
  )
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gold-dark/20 last:border-0">
      <div>
        <p className="text-gold-light font-medium">{label}</p>
        <p className="text-xs text-gold-light/40">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full border transition-all relative ${
        value ? 'bg-gold/30 border-gold' : 'bg-abyss border-gold-dark/50'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
          value ? 'left-6 bg-gold' : 'left-0.5 bg-gold-dark'
        }`}
      />
    </button>
  )
}
