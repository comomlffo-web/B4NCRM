# B4NCRM Executive CRM Dashboard v1

Drop-in upgrade for the existing `comomlffo-web/B4NCRM` static Cloudflare dashboard.

## What it adds

- Executive Business Command Centre above the existing dashboard
- Live booked revenue, bookings, customers and ABV from the existing protected Intelligence API
- RFM evidence state (does not invent segments when evidence is limited)
- Salon-user telemetry status from the existing Salon User Intelligence API
- Customer/risk/no-show signals
- Booking operational attention panel
- Team + menu configuration signals
- Evidence-based priority action queue
- Explicit data readiness: operational facts vs telemetry vs derived models

## Safe architecture

- Does **not** expose CRM Supabase credentials in the browser.
- Reuses the existing staff session token (`b4n_crm_staff_session`).
- Reuses existing B4N Intelligence APIs.
- Does not change the booking application or operational database.
- Does not fabricate empty CRM metrics.

## Install

Copy these files to the B4NCRM repository root:

- `executive-crm-dashboard.js`
- `executive-crm-dashboard.css`
- `install-executive-v1.py`

Then run:

```bash
python3 install-executive-v1.py
```

The script only adds the CSS/JS include tags to `index.html` and is idempotent.

## Current repository access limitation

The connected GitHub account has read access to `comomlffo-web/B4NCRM` but no push permission, so this package was not pushed automatically.
