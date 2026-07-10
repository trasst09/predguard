# PredatorGuard — Operator & Deployment Runbook

This is the launch-readiness runbook for the PredatorGuard MVP: how to deploy,
what environment it needs, the security posture that ships by default, and the
QA/accessibility checks that were performed.

> **Safety note.** Field Operations tooling (panic escalation, live check-ins,
> location sharing, evidence handling) is **simulated for coordination only**.
> The app never contacts 911, law enforcement, or emergency services on a
> user's behalf. Do not deploy for real-world operations without review by
> counsel experienced in child-safety technology (see the spec, §12).

## 1. Architecture at a glance

- **Backend**: single Node HTTP server (`server.js`), no framework.
- **Storage**: Supabase (Postgres). Auth, profiles, missions, quests, reports,
  training, and the Field Ops tables all live in Supabase.
- **Two transports**:
  - **Server transport** (default): the Node server talks to Supabase with the
    service-role key and issues its own HTTP-only session cookie.
  - **Browser transport** (static hosting, e.g. GitHub Pages): the frontend
    talks to Supabase directly with the public anon key. Privileged surfaces
    (admin, Field Ops) show "unavailable on static hosting" notices.
- **Frontend**: static HTML per page + shared `browser-app.js`, `data.js`,
  `config.js`, `styles.css`.

## 2. Environment variables

Copy `.env.example` and fill in:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` (a.k.a. `SUPABASE_SECRET_KEY`) | Service-role key — server only, never ship to the client |
| `SUPABASE_DB_URL` | Postgres connection string for `supabase db push` |
| `PORT` / `HOST` | Optional; default `3000` / `127.0.0.1` |
| `SESSION_COOKIE_SECURE` | Set truthy in production (HTTPS) so the session cookie gets `Secure` |

For static hosting, set the **public** values in `config.js`
(`SUPABASE_URL`, `SUPABASE_ANON_KEY`) — never the service-role key.

## 3. Deploy steps

1. **Apply migrations** (creates/updates all tables incl. Field Ops):
   ```
   npm run supabase:push
   ```
   or push to `main` to trigger the GitHub Action. The latest migration is
   `supabase/migrations/20260709130000_field_ops.sql` (linked accounts,
   evidence vault + chain-of-custody, safety events, location shares).
2. **Set environment variables** on the host (see §2).
3. **Install & start**:
   ```
   npm ci
   npm start
   ```
4. **Smoke test**: `npm test` (see §5) against a throwaway `PORT`.
5. **Verify** the security headers are present on a response (§4).

## 4. Security posture (shipped defaults)

Verified in `server.js`:

- **Session cookie**: `HttpOnly`, `SameSite=Strict`, `Path=/`, `Max-Age`, and
  `Secure` when `SESSION_COOKIE_SECURE` is set. Tokens are SHA-256 hashed at
  rest (`app_sessions.token_hash`), never stored raw.
- **Response headers** (`setSecurityHeaders`): `Content-Security-Policy`
  (strict `script-src 'self' https://cdn.jsdelivr.net`), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`,
  `Permissions-Policy: geolocation=(self), camera=(), microphone=()`,
  `Cross-Origin-Opener-Policy: same-origin`.
- **Route protection**: protected pages redirect anonymous users to `/`; admin
  pages require `isAdmin`; write APIs require a session (`requireUser`) and
  admin APIs require `requireAdmin`.
- **Row-Level Security**: every table (incl. all Field Ops tables) has RLS
  enabled — full access for `service_role`, own-row access for `authenticated`.
- **Input handling**: JSON bodies are size-bounded per field and validated
  against allow-lists (platforms, evidence kinds, statuses, etc.).

### Pre-launch security checklist

- [ ] `SESSION_COOKIE_SECURE` truthy and site served over HTTPS.
- [ ] Service-role key is server-only; `config.js` contains only public values.
- [ ] `npm test` passes.
- [ ] CSP verified in the browser console with no violations on each page
      (sign-in, dashboard, missions, map, training, reporting, leaderboard,
      **safety**, account, admin).
- [ ] Supabase advisors reviewed (`get_advisors` — security & performance).
- [ ] Data-retention/auto-delete policy decided for location shares, evidence,
      and safety events (spec §11: 30–90 day retention unless flagged for LE).

## 5. Testing

```
npm test
```

Runs `test/integration.test.js` (Node's built-in test runner — no framework).
It boots the server and asserts the deterministic contract that does not require
a live Supabase connection: auth-gating (401/403/302), anonymous empty-list
reads on the Field Ops routes, static asset serving, and 404s. Extend it with
authenticated flows once a seeded test Supabase project is available.

## 6. Accessibility pass (performed)

- Semantic structure on the new `/safety` page: labelled inputs,
  `fieldset`/`legend` for consent scopes, `aria-live` status regions on forms,
  `aria-label` on coordinate inputs.
- Primary nav is a labelled landmark; the active link carries `aria-current`.
- No inline event handlers or inline `<script>` (also required for the strict
  CSP), so keyboard and assistive-tech behavior is driven by real controls.
- Buttons and links use `:focus-visible` outlines (`styles.css`).
- Responsive: the Field Ops grid collapses to a single column ≤ 820px.

Remaining a11y follow-ups (not blocking, worth doing before public beta): audit
color contrast on status chips in both themes, and add a skip-to-content link.

## 7. Field Operations API reference

All under `/api`, JSON. GET reads return empty lists for anonymous callers;
writes require a session.

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/linked-accounts` | List / link a consented platform account |
| DELETE | `/api/linked-accounts/:id` | Revoke consent |
| GET/POST | `/api/evidence` | List / seal an evidence item (logs a custody event) |
| POST | `/api/evidence/:id/custody` | Append a chain-of-custody event |
| GET/POST | `/api/safety-events` | List / raise a check-in, backup request, or panic (simulated) |
| PATCH | `/api/safety-events/:id` | Acknowledge or resolve |
| GET/POST | `/api/location-shares` | List / start an auto-expiring location share |
| DELETE | `/api/location-shares/:id` | Revoke a share early |

Location shares expire on read (`withComputedShareStatus`) — no cron sweeper.
Add a background job to persist `expired` only if the table grows large.
