# B4N CRM — Live API + Secure Staff Login

This build connects directly to the existing B4N Intelligence API and mirrors the Lovable app's existing Supabase email/password staff sign-in.

## What changed

- Public Geo + Services/Menu load automatically.
- Revenue, Bookings, Customers, RFM and Staff remain protected.
- A **Sign in** button now appears in the top-right.
- Use the **same staff email/password** used by the Book4Now Lovable app.
- After authentication, B4NCRM checks `user_roles` and only accepts:
  - super_admin
  - admin
  - manager
  - specialist
  - worker
- The Supabase access token is stored only in this browser's localStorage.
- Passwords are sent directly to Supabase Auth and are never stored by B4NCRM.

## Deployment

Replace these files in the `B4NCRM` repository:

- index.html
- styles.css
- script.js
- README.md

Commit and push with GitHub Desktop. Cloudflare should redeploy automatically.

## Important

The public Geo/Menu endpoints do not require login. Operational analytics use the logged-in user's JWT, so the existing Lovable/Supabase RLS policies remain authoritative.
