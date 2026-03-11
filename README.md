# LinkedIn Growth Autopilot

Chrome Extension MV3 + React Dashboard SaaS for LinkedIn outreach automation.

## Tech Stack

- **Dashboard**: React 18 + TypeScript (Vite), SCSS Modules, Zustand, TanStack Query v5, React Router v6
- **Extension**: Chrome Extension Manifest V3, Webpack 5, TypeScript
- **Backend**: Supabase (Postgres + Realtime + Edge Functions + Auth)
- **UI**: dnd-kit, Framer Motion, Recharts, lucide-react

## Prerequisites

- Node.js 20+
- npm 10+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Google Chrome (for extension development)

## Setup

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd linkedin-autopilot
   ```

2. Copy environment files:

   ```bash
   cp dashboard/.env.example dashboard/.env
   cp extension/.env.example extension/.env
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start Supabase locally:

   ```bash
   supabase start
   supabase db push
   ```

5. Run the dashboard:

   ```bash
   npm run dev
   ```

6. Build and load the extension:
   ```bash
   npm run build:ext
   ```
   Then open `chrome://extensions`, enable Developer mode, and click **Load unpacked** pointing to `extension/dist/`.

## Project Structure

```
linkedin-autopilot/
├── dashboard/          # Vite React App (SaaS dashboard)
├── extension/          # Chrome Extension MV3
├── shared/             # Shared types & Supabase clients
├── supabase/           # Supabase config & migrations
└── package.json        # Root workspace
```

## Contributing

### Branch Naming

- `feature/*` — new features
- `fix/*` — bug fixes
- `chore/*` — maintenance, tooling, config

### Workflow

1. Create a branch from `main`
2. Make changes with clear, atomic commits
3. Open a PR against `main`
4. Ensure all checks pass before merging
