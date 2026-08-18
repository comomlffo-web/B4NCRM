# B4NCRM Super Admin Lock

Authorized identity:
- Email: comomlffo@gmail.com
- Required role: super_admin

## Files
1. `index.html`
   - Loads the Super Admin guard before `script.js`.
   - Changes visible Protected Live wording to Super Admin · Live.
   - Removes the hard-coded Dilani greeting.

2. `b4n-super-admin-guard.js`
   - Frontend defense-in-depth.
   - Rejects persisted CRM sessions unless both email + super_admin role match.
   - Blocks protected CRM API calls from unauthorized browser sessions.

3. `b4n-intelligence-api-super-admin.js`
   - Full replacement source for the current main Intelligence Worker.
   - Before every `/api/v1/intelligence/*` request it:
     a. validates the Supabase session via `/auth/v1/user`;
     b. requires email `comomlffo@gmail.com`;
     c. reads `user_roles` using the same JWT;
     d. requires the `super_admin` database role;
     e. fails closed with 401/403.

## Deploy
### B4NCRM GitHub / Cloudflare Pages
Upload/replace:
- `index.html`
- add `b4n-super-admin-guard.js`

Keep the existing:
- `script.js`
- `styles.css`
- `salon-user-intelligence.js/.css`
- `executive-crm-dashboard.js/.css`

### Main Intelligence API Worker
In Cloudflare Workers:
- Open `b4n-intelligence-api`
- Edit code
- Replace Worker source with `b4n-intelligence-api-super-admin.js`
- Deploy

No new secret is required for this patch. It uses the existing:
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- ALLOWED_ORIGINS

## Important
The separate `b4n-salon-user-intelligence-api` must also receive the same exact-email + super_admin check server-side for complete end-to-end enforcement. The frontend guard already blocks its CRM calls, but browser-side checks alone are not a security boundary.
