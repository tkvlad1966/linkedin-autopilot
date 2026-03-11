# Supabase Clients

This project uses multiple Supabase clients, each configured for a specific runtime environment and auth strategy.

| Client | File | Auth Method | Used By |
|--------|------|-------------|---------|
| Dashboard | `supabase-dashboard.ts` | Supabase Auth (email/session) | React Dashboard |
| Extension | `supabase-extension.ts` | Custom JWT via `extension_token` | Chrome Extension |
| Server (TBD) | `supabase-server.ts` | `service_role` key | Apify Actors (future) |

## Usage

### Dashboard (browser)

```ts
import { supabaseDashboard } from '@shared/lib/supabase-dashboard'

// Standard Supabase Auth flow
await supabaseDashboard.auth.signInWithPassword({ email, password })
```

### Extension (service worker)

```ts
import { createExtensionClient } from '@shared/lib/supabase-extension'

// Create a client with a JWT obtained from the auth Edge Function
const supabase = createExtensionClient(jwt)
```

## Important

- **Never** import `supabase-server.ts` in frontend or extension code.
- The Dashboard client uses browser cookies/localStorage for session persistence.
- The Extension client uses `chrome.storage.sync` — session is managed manually.
