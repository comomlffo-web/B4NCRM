# B4NCRM — Live Data Clean Build

This build removes the remaining prototype/demo business data from the dashboard.

## Live after staff sign-in
- Total booked revenue
- Total bookings
- Total customers
- Average booking value
- Revenue overview and daily revenue bars
- Customer intelligence counts
- Booking status snapshot
- Live business summary
- RFM
- Staff performance
- Live service catalogue/menu relationships
- Geo salon address/map data

## Explicitly not fabricated
The booking funnel and conversion rate are now shown as **Insufficient event data** because the Lovable operational database did not historically record service-view, availability-check and abandoned booking-session events.

## Deploy
Replace these four files in the B4NCRM GitHub repository:
- index.html
- script.js
- styles.css
- README.md

Commit + push in GitHub Desktop, then hard refresh after Cloudflare deploys:
Cmd + Shift + R
