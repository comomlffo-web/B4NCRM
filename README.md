# B4NCRM Authentication Hotfix 2

This fixes the Sign in button not opening the credentials form.

## Root cause
The login modal HTML was below `<script src="script.js"></script>`.
The browser executed the script before `#authModal` existed, so the click handler
had no modal element to open.

## Fix
The complete `#authModal` dialog is now parsed before `script.js`.

## Deploy
Replace these four files in the B4NCRM repository:
- index.html
- script.js
- styles.css
- README.md

Commit and push using GitHub Desktop.

After Cloudflare deploys, hard refresh:
**Cmd + Shift + R**

Then click **Sign in**.
