Create a new dashboard page for stalk.ai following the existing patterns in `src/app/(dashboard)/`.

Steps:
1. Read `src/app/(dashboard)/dashboard/page.tsx` to understand the styling conventions (CSS variables, card styles, inline styles, etc.)
2. Read `src/app/(dashboard)/layout.tsx` to understand the layout wrapper
3. Ask the user: "What's the name and purpose of this new page?"
4. Create the page at `src/app/(dashboard)/dashboard/<name>/page.tsx` as a **server component** that:
   - Fetches data from Supabase using `createClient` from `@/lib/supabase/server`
   - Uses the same CSS variables (`var(--bg-card)`, `var(--border)`, `var(--text-primary)`, etc.)
   - Uses inline styles matching the existing dashboard style (no Tailwind classes except `card`, `btn-primary`, `btn-secondary`, `mono`)
   - Has a proper page header with title and optional CTA button
5. Add the new route to the Sidebar in `src/app/(dashboard)/_components/Sidebar.tsx`

Constraints:
- Server components only (no `'use client'` unless strictly necessary for interactivity)
- No new dependencies
- Match the dark theme and spacing of the existing dashboard exactly
