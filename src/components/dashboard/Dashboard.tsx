export function Dashboard() {
  return (
    <div className="p-gutter space-y-gutter">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">CMD Dashboard</h1>
          <p className="font-body-md text-body-md text-secondary">
            Real-time enterprise performance overview for Oct 2023.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface border border-wireframe-border rounded font-label-md text-label-md flex items-center gap-2 hover:bg-wireframe-bg-alt transition-colors">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Select Period
          </button>
          <button className="px-4 py-2 bg-primary text-on-primary rounded font-label-md text-label-md flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiTrend icon="payments" iconBg="bg-primary-container/40" iconColor="text-primary" label="Total Revenue" value="₹48,25,000" trend="12.5%" trendUp meta="Cumulative Financial Year" />
        <KpiTrend icon="event_note" iconBg="bg-secondary-container/40" iconColor="text-secondary" label="Monthly Revenue" value="₹8,42,100" trend="8.2%" trendUp meta="Target: ₹10,00,000" />
        <KpiTrend icon="account_balance_wallet" iconBg="bg-error-container/40" iconColor="text-error" label="Outstanding" value="₹12,80,450" trend="4.1%" trendUp trendError meta="Avg. Aging: 42 Days" />
        <KpiTrend icon="groups" iconBg="bg-surface-container-high" iconColor="text-on-surface" label="Active Customers" value="1,248" trend="22" trendUp meta="Across 14 Regions" />

        {/* Row 2 */}
        <div className="bg-surface border border-wireframe-border p-5 rounded hover:shadow-sm transition-shadow">
          <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Active Orders</h3>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">342</p>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-primary h-full w-[65%]" />
          </div>
          <p className="font-label-sm text-label-sm text-outline mt-2">65% Fulfillment Rate</p>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded hover:shadow-sm transition-shadow">
          <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Dispatches Today</h3>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">58</p>
          <div className="mt-4 flex -space-x-2">
            <div className="w-6 h-6 rounded-full border-2 border-surface bg-primary-fixed" />
            <div className="w-6 h-6 rounded-full border-2 border-surface bg-secondary-fixed" />
            <div className="w-6 h-6 rounded-full border-2 border-surface bg-tertiary-fixed" />
            <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container-highest flex items-center justify-center text-[8px] font-bold">+55</div>
          </div>
          <p className="font-label-sm text-label-sm text-outline mt-2">Status: In-Transit</p>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded hover:shadow-sm transition-shadow">
          <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Collection (MTD)</h3>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">₹6,20,000</p>
          <div className="flex items-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-status-success" />
            <span className="font-label-sm text-label-sm text-secondary">On Track</span>
          </div>
          <p className="font-label-sm text-label-sm text-outline mt-2">Target: ₹7,50,000</p>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded hover:shadow-sm transition-shadow">
          <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">New Leads</h3>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">124</p>
          <div className="flex items-center gap-2 mt-4 text-status-success">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="font-label-sm text-label-sm">Conversion 12%</span>
          </div>
          <p className="font-label-sm text-label-sm text-outline mt-2">Last 7 days</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesTrend />
        <ProductSales />
        <StateMap />
        <AgingTrend />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <TopCustomers />
        <RecentOrders />
        <PendingCollections />
      </div>
    </div>
  );
}

function KpiTrend({
  icon, iconBg, iconColor, label, value, trend, trendUp, trendError, meta,
}: {
  icon: string; iconBg: string; iconColor: string; label: string; value: string;
  trend: string; trendUp?: boolean; trendError?: boolean; meta: string;
}) {
  return (
    <div className="bg-surface border border-wireframe-border p-5 rounded hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className={`p-2 rounded ${iconBg}`}>
          <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
        </span>
        <span className={`font-label-sm text-label-sm flex items-center ${trendError ? "text-error" : "text-status-success"}`}>
          <span className="material-symbols-outlined text-[14px]">
            {trendUp ? "arrow_upward" : "arrow_downward"}
          </span>
          {trend}
        </span>
      </div>
      <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">{label}</h3>
      <p className="font-headline-md text-headline-md text-on-surface mt-1">{value}</p>
      <p className="font-label-sm text-label-sm text-outline mt-2 italic">{meta}</p>
    </div>
  );
}

function SalesTrend() {
  return (
    <div className="bg-surface border border-wireframe-border p-6 rounded min-h-[350px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Sales Trend</h3>
        <select className="bg-wireframe-bg-alt border border-wireframe-border rounded font-label-sm text-label-sm p-1">
          <option>Last 6 Months</option>
          <option>Year to Date</option>
        </select>
      </div>
      <div className="flex-1 relative border-b border-l border-outline-variant pb-6 pl-2">
        <svg className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-2rem)]" preserveAspectRatio="none" viewBox="0 0 100 40">
          <defs>
            <linearGradient id="grad" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#00288e" stopOpacity="1" />
              <stop offset="100%" stopColor="#00288e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 35 L20 25 L40 30 L60 10 L80 15 L100 5 V40 H0 Z" fill="url(#grad)" opacity="0.15" />
          <path d="M0 35 L20 25 L40 30 L60 10 L80 15 L100 5" fill="none" stroke="#00288e" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="font-label-sm text-label-sm text-outline absolute bottom-0 left-2">May</span>
        <span className="font-label-sm text-label-sm text-outline absolute bottom-0 left-1/4">Jun</span>
        <span className="font-label-sm text-label-sm text-outline absolute bottom-0 left-2/4">Jul</span>
        <span className="font-label-sm text-label-sm text-outline absolute bottom-0 left-3/4">Aug</span>
        <span className="font-label-sm text-label-sm text-outline absolute bottom-0 right-2">Oct</span>
      </div>
    </div>
  );
}

function ProductSales() {
  const bars = [
    { label: "Industrial", h: 40 },
    { label: "Steel", h: 85 },
    { label: "Tools", h: 60 },
    { label: "Automotive", h: 30 },
    { label: "Electronics", h: 75 },
  ];
  return (
    <div className="bg-surface border border-wireframe-border p-6 rounded min-h-[350px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Product Sales</h3>
        <span className="material-symbols-outlined text-secondary cursor-pointer">more_horiz</span>
      </div>
      <div className="flex-1 flex items-end justify-around gap-4 px-2">
        {bars.map((b) => (
          <div key={b.label} className="flex flex-col items-center gap-2 w-full h-full justify-end">
            <div className="w-full bg-primary chart-bar" style={{ height: `${b.h}%` }} />
            <span className="font-label-sm text-label-sm text-outline">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StateMap() {
  return (
    <div className="bg-surface border border-wireframe-border p-6 rounded flex flex-col h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">State-wise Distribution</h3>
        <button className="text-primary font-label-md text-label-md hover:underline">View Heatmap</button>
      </div>
      <div className="flex-1 relative bg-wireframe-bg-alt rounded overflow-hidden">
        <div
          className="absolute inset-0 opacity-40 grayscale bg-center bg-no-repeat bg-contain"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDf46RNtB2_Po8B1pz1Hv2DHGGH58t3INgEAxgNDsGYAzadDMKHxvs4lx1cnh3gnNV4QoHfWRG2-NoI8fOJe0m9Tp-B27aHFcO7MTmWYx0POLGgJc8pwu0bnw1yv6s3ltFODQqbWF2_p24Nw7NXdnAvIjyXDA74HU68IiFs3_UAtToJzDPXAA0y_D1odtgyx4xtrADyaWaI6FG3US5fP1GgGlQoaoPcE0KdCaFUpNsgoGUKm2llQpsTbFp7VLOAuzpN8FY3FnEYMHLx')",
          }}
        />
        <div className="absolute top-10 left-20 flex flex-col items-center">
          <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
          <div className="mt-1 bg-surface px-2 py-1 border border-wireframe-border rounded shadow-lg">
            <p className="font-label-sm text-[10px] font-bold">Punjab: 45%</p>
          </div>
        </div>
        <div className="absolute bottom-20 right-32 flex flex-col items-center">
          <div className="w-3 h-3 bg-primary rounded-full" />
          <div className="mt-1 bg-surface px-2 py-1 border border-wireframe-border rounded shadow-lg">
            <p className="font-label-sm text-[10px] font-bold">Maharashtra: 22%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgingTrend() {
  const rows = [
    { label: "0 - 30 Days", amt: "₹4,25,000 (33%)", w: 33, color: "bg-status-success" },
    { label: "31 - 60 Days", amt: "₹5,10,000 (40%)", w: 40, color: "bg-status-warning" },
    { label: "61 - 90 Days", amt: "₹2,35,000 (18%)", w: 18, color: "bg-error opacity-60" },
    { label: "90+ Days", amt: "₹1,10,450 (9%)", w: 9, color: "bg-error" },
  ];
  return (
    <div className="bg-surface border border-wireframe-border p-6 rounded flex flex-col h-[400px]">
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-6">Aging &amp; Outstanding Trend</h3>
      <div className="space-y-6">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between font-label-md text-label-md mb-2">
              <span className="text-secondary">{r.label}</span>
              <span className="font-bold">{r.amt}</span>
            </div>
            <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
              <div className={`${r.color} h-full rounded-full`} style={{ width: `${r.w}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopCustomers() {
  const rows = [
    { i: "TC", name: "Tata Components", tier: "Tier 1 Partner", v: "₹12.4L", bg: "bg-primary-fixed" },
    { i: "RM", name: "Reliance Mart", tier: "Strategic Client", v: "₹8.9L", bg: "bg-secondary-fixed" },
    { i: "JS", name: "JSW Steel Ltd", tier: "Key Account", v: "₹6.2L", bg: "bg-tertiary-fixed" },
    { i: "AM", name: "Adani Metals", tier: "Enterprise", v: "₹5.8L", bg: "bg-surface-container-high" },
  ];
  return (
    <TableCard title="Top Customers" icon="group">
      <table className="w-full text-left font-body-md text-body-md">
        <tbody>
          {rows.map((r) => (
            <tr key={r.i} className="border-b border-outline-variant hover:bg-surface-container-lowest">
              <td className="p-4 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${r.bg} flex items-center justify-center text-[10px] font-bold`}>
                  {r.i}
                </div>
                <div>
                  <p className="font-bold">{r.name}</p>
                  <p className="text-[10px] text-outline">{r.tier}</p>
                </div>
              </td>
              <td className="p-4 text-right">{r.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}

function RecentOrders() {
  const rows = [
    { id: "#ORD-4592", t: "2 mins ago", s: "PROCESSING", sc: "bg-surface-container text-primary", v: "₹24,500" },
    { id: "#ORD-4591", t: "1 hour ago", s: "SHIPPED", sc: "bg-secondary-container/40 text-secondary", v: "₹1,12,000" },
    { id: "#ORD-4590", t: "3 hours ago", s: "DELIVERED", sc: "bg-status-success/10 text-status-success", v: "₹45,200" },
    { id: "#ORD-4589", t: "5 hours ago", s: "HOLD", sc: "bg-error-container/40 text-error", v: "₹9,800" },
  ];
  return (
    <TableCard title="Recent Orders" icon="shopping_bag">
      <table className="w-full text-left font-body-md text-body-md">
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-outline-variant hover:bg-surface-container-lowest">
              <td className="p-4">
                <p className="font-bold">{r.id}</p>
                <p className="text-[10px] text-outline">{r.t}</p>
              </td>
              <td className="p-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.sc}`}>{r.s}</span>
              </td>
              <td className="p-4 text-right">{r.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}

function PendingCollections() {
  const rows = [
    { name: "Bajaj Auto", note: "Overdue 12 Days", noteCls: "text-error", v: "₹85K", icon: "send" },
    { name: "Hero Moto", note: "Overdue 8 Days", noteCls: "text-error", v: "₹210K", icon: "send" },
    { name: "MRF Tyres", note: "Due in 2 Days", noteCls: "text-status-warning", v: "₹45K", icon: "schedule" },
    { name: "Apollo Tubes", note: "Overdue 45 Days", noteCls: "text-error", v: "₹32K", icon: "send" },
  ];
  return (
    <TableCard title="Pending Collections" icon="priority_high" iconColor="text-error">
      <table className="w-full text-left font-body-md text-body-md">
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-outline-variant hover:bg-surface-container-lowest">
              <td className="p-4">
                <p className="font-bold">{r.name}</p>
                <p className={`text-[10px] font-semibold ${r.noteCls}`}>{r.note}</p>
              </td>
              <td className="p-4 text-right font-headline-sm text-headline-sm">{r.v}</td>
              <td className="p-4 text-right">
                <button className="p-1 hover:bg-surface-container rounded transition-colors">
                  <span className="material-symbols-outlined text-outline">{r.icon}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}

function TableCard({
  title, icon, iconColor = "text-outline", children,
}: { title: string; icon: string; iconColor?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-wireframe-border rounded overflow-hidden flex flex-col">
      <div className="p-4 bg-wireframe-bg-alt border-b border-wireframe-border flex justify-between items-center">
        <h3 className="font-label-md text-label-md uppercase tracking-tight text-on-surface">{title}</h3>
        <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}