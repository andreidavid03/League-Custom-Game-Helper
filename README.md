# ⚔️ LoL Custom Game Helper

The fun way to organize **League of Legends custom 5v5 games** with friends. One person hosts, adds everyone to the roster, and lets fate build the teams — with style.

![LoL Custom Game Helper](./Assets/icon-128.png)

**Local-first**: everything is stored on your device. No accounts, no server, works offline. Export/import your data as JSON whenever you want.

## 🎲 Seven ways to build teams

| Mode | What happens |
|---|---|
| 🎡 **Wheel of Fate** | Spin the wheel — each spin sends a summoner to a team |
| 📦 **Case Opening** | CS:GO-style unboxing, sound included |
| 🎰 **Slot Machine** | Pull the lever, the reel decides |
| 🃏 **Card Draw** | Flip face-down cards to reveal who you drew |
| 👑 **Captain Draft** | Two captains, coin flip, snake-order picks |
| ⚖️ **Balanced Teams** | Fair teams weighted by player rank |
| ⚡ **Instant Random** | No ceremony, teams right now |

Plus, for any mode:

- 🏹 **Role assignment** — Top / Jungle / Mid / ADC / Support, optionally respecting each player's preferred roles
- 🧙 **Random champions** — ARAM-style with 2 rerolls per player, live champion data and icons from Riot's free [Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon) (no API key needed)
- 📋 **Copy for Discord** — paste the teams straight into your lobby chat
- 📜 **Match history & stats** — win rates, role distribution, most frequent teammates, blue/red side win split

## 🏁 Quick start (web)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. That's it — there is no backend to run.

### Production build

```bash
cd frontend && npm run build
```

This produces a fully static site in `frontend/out/` — host it on **GitHub Pages, Vercel, Netlify, or any static file server**. Share the URL with friends; their data stays on their own devices.

## 📱 Mobile (PWA)

The app is an installable Progressive Web App:

1. Open the deployed URL on your phone
2. **Add to Home Screen** (Safari share menu / Chrome ⋮ menu)
3. It launches full-screen and works offline

## 🖥️ Desktop app (Tauri)

The repo ships a [Tauri](https://tauri.app) scaffold for native Mac/Windows/Linux builds (~10 MB):

```bash
# one-time: install Rust from https://rustup.rs
cd frontend
npm run tauri dev     # run as a desktop app
npm run tauri build   # produce installers
```

## 🚀 Tech stack

- **Next.js 14** (static export) + **TypeScript** + **React 18**
- **Tailwind CSS 4** — custom Hextech design system
- **Framer Motion** — animations
- **Zustand** (persisted) — local-first storage
- **Tauri 2** — desktop builds

```
frontend/src/
├── app/              # Next.js shell + Hextech theme
├── lib/              # types, store, team logic, Data Dragon, sounds
└── components/
    ├── tabs/         # Play, Players, History, Stats, Settings
    ├── modes/        # the seven randomizer rituals
    └── ui.tsx        # Hextech UI primitives
```

> The `backend/` folder contains the old Hono/SQLite API. It is **not used** by the app anymore — it's parked for a future online mode (accounts, shared rooms, live spectating).

## 🗺️ Roadmap

- [ ] Shared rooms — everyone watches the wheel spin from their own phone
- [ ] Accounts & cloud sync
- [ ] Riot API integration for automatic rank lookup
- [ ] Tournament brackets
- [ ] Discord bot

## 📄 License

MIT — made with ❤️ by **David Demon** for LoL game nights.

League of Legends is a registered trademark of Riot Games. This is a fan project; champion data and images are served from Riot's public Data Dragon CDN.
