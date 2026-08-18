B4N CRM — CUSTOMER INTELLIGENCE WORKER HOTFIX

Problem:
The deployed B4NCRM frontend is calling:
  /api/v1/crm/customer-workspace

The current live b4n-intelligence-api Worker returns:
  not_found

Fix:
Replace the code of the Cloudflare Worker:
  b4n-intelligence-api

with:
  b4n-intelligence-api.js

Required Worker environment variables:
  SUPABASE_URL
  SUPABASE_PUBLISHABLE_KEY
  ALLOWED_ORIGINS

Also required for Customer Intelligence:
  CRM_SUPABASE_URL = https://bpbdtbgztwhiqswnbijy.supabase.co
  CRM_SALON_ID = 1
  CRM_SERVICE_ROLE_KEY = Secret

CRM_SERVICE_ROLE_KEY must be the B4N CRM project service-role key and must remain a Cloudflare Secret.

After deployment:
1. Hard refresh B4NCRM (Cmd + Shift + R on Mac).
2. Open Customer Intelligence.
3. Expected badge: Super Admin · Live.
4. Expected current snapshot:
   Customers 39
   Booked value LKR 257,680
   Completed revenue LKR 9,100
   RFM scored 2
   Risk scored 0
   NBA ready 0

No frontend redeployment is required for this hotfix.
