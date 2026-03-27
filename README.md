# PokéDex Frontend

A Vue 3 + Vite single-page application providing a premium, dark-mode Pokédex experience with battles, teams, and social features.

## Tech Stack

- **Vue 3** (Composition API + `<script setup>`)
- **Vite** — build tool
- **Pinia** — state management
- **Vue Router 4** — client-side routing
- **Axios** — API communication
- **Google Fonts** — Inter + Outfit
- Vanilla CSS with glassmorphism design system

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3001/api
```

For production on Railway, set:

```env
VITE_API_URL=https://your-backend.up.railway.app/api
```

## Local Development

```bash
npm install
npm run dev      # Starts on http://localhost:5173
```

## Build for Production

```bash
npm run build    # Outputs to /dist
npm run preview  # Preview production build
```

## Features

| Feature | Description |
|---------|-------------|
| 🔐 Auth | Login / Register with JWT |
| 📋 Pokédex | Browse all ~1025 Pokémon with infinite scroll |
| 🔍 Filters | Filter by name, type 1, type 2, and region |
| 📖 Detail | Stats, species info, evolution chain, moves |
| ❤️ Favorites | Save and manage favorite Pokémon |
| ⚔️ Teams | Create teams with up to 6 Pokémon + move selection |
| 👥 Social | Search trainers, send/accept friend requests |
| 🏟️ Battles | Turn-based battles with friends using real Pokémon stats |

## Routes

| Path | View | Auth |
|------|------|------|
| `/` | Login | No |
| `/register` | Register | No |
| `/pokedex` | Pokédex Grid | ✓ |
| `/pokemon/:id` | Detail | ✓ |
| `/favorites` | Favorites | ✓ |
| `/teams` | Team Manager | ✓ |
| `/social` | Friends | ✓ |
| `/battles` | Battles Hub | ✓ |
| `/battles/:id` | Battle Arena | ✓ |

## Deployment to Railway

1. Push code to GitHub
2. Create a new Railway service, connect the repo
3. Set build command: `npm run build`
4. Set start command: `npx serve dist`
5. Add environment variable: `VITE_API_URL=https://your-backend.up.railway.app/api`

> **Note:** Set `VITE_API_URL` before building — Vite bakes env vars at build time.
