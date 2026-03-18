# Meditation Timer

## Stack
- **Package manager:** Bun (never npm/yarn)
- **Framework:** Expo SDK 55, React Native 0.83, React 19.2
- **Routing:** Expo Router (file-based)
- **Styling:** NativeWind v4 + tailwindcss pinned to 3.4.17 (do NOT upgrade)
- **Backend:** Convex (real-time, serverless)
- **Testing:** Vitest
- **Language:** TypeScript (strict)

## Conventions
- Default branch is `main`
- Feature branches: `feature/short-description`
- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`
- All merges through Pull Requests

## Scripts
- `bun run dev` — start Expo dev server
- `bun run lint` — ESLint
- `bun run typecheck` — TypeScript check
- `bun run test` — Vitest

## Do NOT
- Use any-type assertions
- Hardcode colors (use Tailwind classes)
- Upgrade tailwindcss above 3.4.17 (breaks NativeWind v4)
