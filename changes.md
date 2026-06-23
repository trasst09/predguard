# Changes

- Converted the original single-page prototype into a multi-page app with a dedicated sign-in experience in `index.html`.
- Added focused pages for the major product areas:
  `dashboard.html`, `onboarding.html`, `missions.html`, `training.html`, `reporting.html`, `leaderboard.html`, and `roadmap.html`.
- Extracted shared seeded content into `data.js` so profile data, mission data, training modules, scoring, and roadmap content are reused across pages.
- Rebuilt `app.js` around page-aware rendering so each page only initializes the components it needs.
- Expanded `styles.css` with shared navigation, auth layout, page cards, and responsive multi-page styling.
- Preserved the original product direction while making each part of the website accessible as its own screen with shared navigation.
- Added a local Node backend in `server.js` with persisted accounts, password hashing, HTTP-only sessions, protected page routes, and JSON auth APIs.
- Replaced the mock sign-in form with real sign-in and registration flows, plus a protected `account.html` page for profile and password management.
- Added an admin-only access path in `admin.html` and matching `/api/admin/*` endpoints for reviewing users and updating roles, verification, points, and admin status.
- Added Supabase-aware backend support in `server.js`. When `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are present, auth and account records are stored in Supabase instead of the local JSON fallback.
- Added [supabase/schema.sql](C:\Users\maxxi\Documents\predguard\supabase\schema.sql) and [.env.example](C:\Users\maxxi\Documents\predguard\.env.example) so the project can be wired to a Supabase `profiles` table with a clean environment-variable setup.
- Added static-host auth support for GitHub Pages in `app.js` and `config.js`. The frontend now falls back to browser-side Supabase auth when `/api` is unavailable, uses subpath-safe page redirects, and relies on public Supabase config instead of the Node server for sign-in and registration.
