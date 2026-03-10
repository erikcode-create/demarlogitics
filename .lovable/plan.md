

## Problem

When invited users click their email link, they land on the Auth page which only has a password login form. They have no password yet, so they can't sign in. The invite magic link includes a token in the URL that needs to be detected and exchanged to authenticate the user, then they should be prompted to set a password.

## Plan

### 1. Create a Set Password page (`src/pages/SetPassword.tsx`)
- Detects the invite/recovery token from the URL hash on mount
- Calls `supabase.auth.verifyOtp()` with `type: 'invite'` to exchange the token
- Shows a "Set your password" form once authenticated
- Calls `supabase.auth.updateUser({ password })` to save the password
- Redirects to `/dashboard` on success

### 2. Update Auth page (`src/pages/Auth.tsx`)
- On mount, check URL hash for `type=invite` or `type=signup` tokens
- If found, redirect to `/set-password` with the hash preserved

### 3. Add route in `src/App.tsx`
- Add `/set-password` as a public route (alongside `/auth`)

### 4. Update Edge Function redirect
- Change `redirectTo` in `invite-user/index.ts` to point to the app's origin + `/set-password` so invited users land directly on the password setup page

