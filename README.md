# B4NCRM — Magic Link Login

Adds passwordless Magic Link login while keeping the existing password login.

## Security behavior

- Uses the existing Book4Now / Lovable Supabase Auth project.
- `shouldCreateUser: false` — entering an unknown email does not create an account.
- After a Magic Link is clicked, B4NCRM verifies `user_roles`.
- Only these roles can enter the CRM:
  - super_admin
  - admin
  - manager
  - specialist
  - worker
- Customer-only accounts are rejected.
- The password is never used or stored for Magic Link login.
- Existing Supabase RLS still protects the Intelligence API.

## One required Supabase/Lovable Auth configuration

The CRM callback URL must be allowed in Auth redirect URLs:

https://b4ncrm.comomlffo.workers.dev/

If the redirect URL is not allow-listed, Supabase will not return Magic Link users to the CRM correctly.

## Deploy

Replace:
- index.html
- styles.css
- script.js
- README.md

Commit and push with GitHub Desktop. After Cloudflare deploys, hard-refresh with:
Cmd + Shift + R
