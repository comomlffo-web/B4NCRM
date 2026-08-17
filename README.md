# B4N CRM — Live Intelligence API build

This build connects the CRM frontend to:

`https://b4n-intelligence-api.comomlffo.workers.dev`

## Live immediately
- Salon name/address/latitude/longitude/Google Maps link
- Live salon count
- Live services
- Menu relationship counts: services, add-ons, suggestions, product links

## Protected analytics
Revenue, bookings, customers, RFM and staff endpoints remain protected by the existing Lovable/Supabase RLS.

The UI no longer presents demo protected numbers as live data. It displays `Protected` until an authenticated Supabase access token is available.

Supported token storage for the next auth step:
- `b4n_supabase_access_token`
- `sb-wazhhgcjrstfrxbwtcvj-auth-token`

## Deploy
Replace the files in the `B4NCRM` GitHub repository with:
- index.html
- styles.css
- script.js
- README.md

Commit in GitHub Desktop and push. Cloudflare's connected deployment should rebuild automatically.
