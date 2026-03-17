

# Smoother UX Overhaul

This is a large initiative covering 5 areas. I recommend we tackle them in phases across multiple messages. Here is the full plan:

---

## Phase 1: Loading States and Page Transitions

**Problem**: Pages show raw "Loading..." text or flash empty content before data arrives.

**Changes**:
- **`src/App.tsx`**: Replace the plain "Loading..." text with a branded spinner/skeleton screen
- **`src/context/AppContext.tsx`**: Expose a `loading` boolean so pages know when initial data fetch is in progress
- **Create `src/components/ui/page-loader.tsx`**: A reusable skeleton component with pulsing card placeholders that matches the dark theme
- **`src/pages/Dashboard.tsx`, `Loads.tsx`, `Carriers.tsx`, `Shippers.tsx`**: Wrap content in a conditional that shows skeleton cards while `loading` is true
- **Add CSS transitions**: Fade-in animation on main content area in `AppLayout.tsx`

---

## Phase 2: Toast Notifications and Feedback

**Problem**: Some actions silently succeed or fail. Inconsistent toast usage across pages.

**Changes**:
- **Audit all `setLoads`, `setShippers`, `setCarriers` calls**: Add `toast.success()` after every create/update/delete action that doesn't already have one
- **`src/context/AppContext.tsx`**: Add error handling in `syncToSupabase` that surfaces failures via toast instead of just `console.error`
- **Standardize toast style**: Use sonner consistently (currently both shadcn toaster and sonner are mounted). Remove the duplicate `<Toaster />` from `App.tsx` and use only sonner

---

## Phase 3: Global Search

**Problem**: The top bar search input is decorative -- it doesn't actually search anything.

**Changes**:
- **`src/components/layout/TopBar.tsx`**: Wire the search input to a command palette dialog (using the existing `command.tsx` component)
- **Create `src/components/layout/GlobalSearch.tsx`**: A command palette that searches across loads (by load number, reference, origin/destination), shippers (by company name), and carriers (by company name, MC number). Results link directly to detail pages.
- **Keyboard shortcut**: `Cmd+K` / `Ctrl+K` opens the search

---

## Phase 4: Quick Actions

**Problem**: Common tasks require too many clicks and page navigations.

**Changes**:
- **`src/pages/Loads.tsx`**: Add inline status dropdown per row so you can change load status without opening the detail page
- **`src/pages/LoadDetail.tsx`**: Add a quick-action bar at the top with one-click buttons: "Mark In Transit", "Mark Delivered", "Generate Rate Con"
- **`src/pages/Carriers.tsx`**: Add a "Send Portal Invite" action button directly in the table row
- **Breadcrumbs**: Add a `Breadcrumb` component to detail pages (e.g., Loads > DT-2026-001) using the existing `breadcrumb.tsx` UI component

---

## Phase 5: Draft System for Forms and Documents

**Problem**: If you start filling out a load form or rate con and navigate away, everything is lost.

**Changes**:
- **`src/hooks/useDraft.ts`** (new): A custom hook that auto-saves form state to `localStorage` with a key like `draft:load:new` or `draft:ratecon:{loadId}`. Includes `saveDraft`, `loadDraft`, `clearDraft` functions.
- **`src/pages/Loads.tsx`**: When the create dialog opens, load any existing draft. Auto-save on every field change (debounced 500ms). Show a "Draft restored" toast when a draft is loaded. Clear draft on successful save.
- **`src/components/documents/RateConBuilder.tsx`**: Same pattern -- auto-save the rate con fields as a draft while editing. Show "Draft saved" indicator.
- **`src/components/documents/BolBuilder.tsx`**: Same draft pattern.
- **`src/pages/ContractNew.tsx`**: Same draft pattern for contract creation.
- **Visual indicator**: Show a small "Draft" badge next to the form title when working from a saved draft, with a "Discard draft" button.

---

## Implementation Order

Given the scope, I recommend implementing this across 3-4 messages:
1. **Message 1**: Phase 1 (loading states) + Phase 2 (toast cleanup)
2. **Message 2**: Phase 3 (global search with Cmd+K)
3. **Message 3**: Phase 4 (quick actions + breadcrumbs)
4. **Message 4**: Phase 5 (draft system)

Want me to start with the first batch?

