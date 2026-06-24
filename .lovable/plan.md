## Goal

Recreate the "CMD Dashboard" screen from the referenced HTML as a TanStack Start app. The HTML provides a single dashboard view (KPIs, charts, tables) but references a `SideNavBar` + `TopNavBar` shell — I'll build a static, presentational version of that shell so the layout matches the screenshots.

## Scope

One route (`/`) rendering the dashboard. No backend, no auth, no interactivity beyond hover states and a non-functional period/export button. All data is static, taken verbatim from the HTML (revenue, customers, orders, collections, etc.).

## Structure

```text
src/routes/
  __root.tsx         (update head: title "CMD Dashboard", Material Symbols + Inter font via <link>)
  index.tsx          (renders <DashboardLayout><Dashboard /></DashboardLayout>)
src/components/dashboard/
  SideNav.tsx        (left 260px nav: logo + sections Dashboard/Sales/Orders/Customers/Collections/Reports/Settings)
  TopNav.tsx         (search, notifications, user avatar)
  DashboardLayout.tsx
  KpiCard.tsx        (variants: with-trend, with-progress, with-avatars, with-status)
  SalesTrendChart.tsx     (inline SVG line chart from HTML)
  ProductSalesChart.tsx   (CSS bar chart)
  StateDistribution.tsx   (hotlinks the Google-hosted India map image as background)
  AgingTrend.tsx          (4 progress bars: 0-30 / 31-60 / 61-90 / 90+)
  TopCustomersTable.tsx
  RecentOrdersTable.tsx
  PendingCollectionsTable.tsx
```

## Design tokens (src/styles.css)

The HTML uses custom semantic classes (`bg-surface`, `text-on-surface`, `border-wireframe-border`, `bg-primary-container`, `text-status-success`, `font-headline-lg`, etc.). I'll map these to a Material-3-style token set in `@theme inline`:

- Colors: `--primary: #00288e` (from the SVG stroke), surface white, on-surface near-black, secondary/tertiary muted blues, `status-success` green, `status-warning` amber, `error` red, `wireframe-border` light gray, `wireframe-bg-alt` very light gray, plus `*-container`, `*-fixed`, `outline`, `outline-variant`, `surface-container-*` neutrals.
- Typography utilities `font-headline-lg/md/sm`, `font-label-md/sm`, `font-body-md` with matching `text-headline-*` sizes — defined as plain CSS classes in styles.css (Tailwind v4 `@utility` blocks) so the HTML classes work as-is.
- `gutter` spacing token (`--spacing-gutter: 1.5rem`) for `p-gutter` / `space-y-gutter`.
- Load Inter + Material Symbols via `<link>` tags in `__root.tsx` head (not in styles.css).

## Content fidelity

Copy KPI values, table rows, chart data, and the India-map image URL straight from the HTML so the result visually matches the screenshots. Replace `material-symbols-outlined` `<span>` icons with the same class (loaded via Google Fonts link) — keeping the HTML structure means less drift.

## Out of scope

- Real charts library, real data, routing to sub-pages from the side nav, dark mode, mobile responsive polish beyond what's already in the markup.
- Backend / Lovable Cloud (not needed for a static dashboard).

Ready to build on approval.