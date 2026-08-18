B4NCRM CUSTOMER INTELLIGENCE LIVE

CRM DB: already complete and verified.
Current Salon 1: 39 customers; LKR 257,680 booked; 6 completed visits; LKR 9,100 completed revenue; 2 RFM scored; 0 risk scored; 0 NBA ready.

B4NCRM repo (comomlffo-web/B4NCRM):
- replace index.html
- add customer-intelligence-live.js
- add customer-intelligence-live.css

Main Worker b4n-intelligence-api:
- replace code with b4n-intelligence-api-customer-workspace.js
- add CRM_SUPABASE_URL = https://bpbdtbgztwhiqswnbijy.supabase.co
- add CRM_SERVICE_ROLE_KEY as Secret (CRM project service-role key)
- add CRM_SALON_ID = 1
- keep SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ALLOWED_ORIGINS

Security: exact comomlffo@gmail.com + database super_admin role required. CRM RPC is service_role only. No names/phones/emails returned.

After deploy: hard refresh, sign in, Analytics Hub > Customer Intelligence.
