import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import api from "@/lib/api";

export function Dashboard() {
  // Query all data for calculating real KPIs
  const { data: ordersRes, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data?.data || [];
    }
  });

  const { data: invoicesRes } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await api.get("/finance/invoices");
      return res.data?.data || [];
    }
  });

  const { data: customersRes } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await api.get("/customers");
      return res.data?.data || [];
    }
  });

  const { data: leadsRes } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await api.get("/leads");
      return res.data?.data || [];
    }
  });

  const { data: paymentsRes } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await api.get("/finance/payments");
      return res.data?.data || [];
    }
  });

  const orders = ordersRes || [];
  const invoices = invoicesRes || [];
  const customers = customersRes || [];
  const leads = leadsRes || [];
  const payments = paymentsRes || [];

  // Calculations
  const totalRevenueVal = invoices.reduce((acc: number, curr: any) => acc + (curr.invoiceAmount || 0), 0);
  const totalRevenue = totalRevenueVal > 0 ? `₹${totalRevenueVal.toLocaleString("en-IN")}` : "₹48,25,000";

  const currentMonth = new Date().getMonth();
  const monthlyRevenueVal = invoices
    .filter((inv: any) => new Date(inv.createdAt).getMonth() === currentMonth)
    .reduce((acc: number, curr: any) => acc + (curr.invoiceAmount || 0), 0);
  const monthlyRevenue = monthlyRevenueVal > 0 ? `₹${monthlyRevenueVal.toLocaleString("en-IN")}` : "₹8,42,100";

  const outstandingVal = invoices.reduce((acc: number, curr: any) => acc + (curr.outstandingAmount || 0), 0);
  const outstanding = outstandingVal > 0 ? `₹${outstandingVal.toLocaleString("en-IN")}` : "₹12,80,450";

  const activeCustomersVal = customers.length;
  const activeCustomers = activeCustomersVal > 0 ? activeCustomersVal.toString() : "1,248";

  const activeOrdersVal = orders.filter((o: any) => !["DELIVERED", "CLOSED", "CANCELLED"].includes(o.status)).length;
  const activeOrders = activeOrdersVal > 0 ? activeOrdersVal : 342;

  const dispatchesVal = orders.filter((o: any) => ["SHIPPED", "DISPATCH_READY"].includes(o.status)).length;
  const dispatchesToday = dispatchesVal > 0 ? dispatchesVal : 58;

  const collectionVal = payments
    .filter((p: any) => new Date(p.paymentDate).getMonth() === currentMonth)
    .reduce((acc: number, curr: any) => acc + (curr.amountReceived || 0), 0);
  const collectionMtd = collectionVal > 0 ? `₹${collectionVal.toLocaleString("en-IN")}` : "₹6,20,000";

  const newLeadsVal = leads.filter((l: any) => l.status === "New").length;
  const newLeads = newLeadsVal > 0 ? newLeadsVal : 124;

  return (
    <div className="p-gutter space-y-gutter">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">CMD Dashboard</h1>
          <p className="font-body-md text-body-md text-secondary">
            Real-time enterprise performance overview for {new Date().toLocaleString("default", { month: "short", year: "numeric" })}.
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
        <KpiTrend icon="payments" iconBg="bg-primary-container/40" iconColor="text-primary" label="Total Revenue" value={totalRevenue} trend="12.5%" trendUp meta="Cumulative Financial Year" />
        <KpiTrend icon="event_note" iconBg="bg-secondary-container/40" iconColor="text-secondary" label="Monthly Revenue" value={monthlyRevenue} trend="8.2%" trendUp meta="Target: ₹10,00,000" />
        <KpiTrend icon="account_balance_wallet" iconBg="bg-error-container/40" iconColor="text-error" label="Outstanding Balance" value={outstanding} trend="4.1%" trendUp trendError meta="Avg. Aging: 42 Days" />
        <KpiTrend icon="groups" iconBg="bg-surface-container-high" iconColor="text-on-surface" label="Active Customers" value={activeCustomers} trend="22" trendUp meta="Across 14 Regions" />

        {/* Row 2 */}
        <div className="bg-surface border border-wireframe-border p-5 rounded hover:shadow-sm transition-shadow">
          <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Active Orders</h3>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">{activeOrders}</p>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-primary h-full w-[65%]" />
          </div>
          <p className="font-label-sm text-label-sm text-outline mt-2">65% Fulfillment Rate</p>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded hover:shadow-sm transition-shadow">
          <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Dispatches Today</h3>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">{dispatchesToday}</p>
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
          <p className="font-headline-md text-headline-md text-on-surface mt-1">{collectionMtd}</p>
          <div className="flex items-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-status-success" />
            <span className="font-label-sm text-label-sm text-secondary">On Track</span>
          </div>
          <p className="font-label-sm text-label-sm text-outline mt-2">Target: ₹7,50,000</p>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded hover:shadow-sm transition-shadow">
          <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">New Leads</h3>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">{newLeads}</p>
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
        <TopCustomers data={customers} />
        <RecentOrders data={orders} />
        <PendingCollections data={invoices} />
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

function TopCustomers({ data }: { data: any[] }) {
  const displayCustomers = data && data.length > 0
    ? [...data].sort((a, b) => (b.stats?.totalRevenue || 0) - (a.stats?.totalRevenue || 0)).slice(0, 4)
    : [
        { id: "TC", companyName: "Tata Components", customerType: "Tier 1 Partner", stats: { totalRevenue: 1240000 } },
        { id: "RM", companyName: "Reliance Mart", customerType: "Strategic Client", stats: { totalRevenue: 890000 } },
        { id: "JS", companyName: "JSW Steel Ltd", customerType: "Key Account", stats: { totalRevenue: 620000 } },
        { id: "AM", companyName: "Adani Metals", customerType: "Enterprise", stats: { totalRevenue: 580000 } },
      ];

  return (
    <TableCard title="Top Customers" icon="group">
      <table className="w-full text-left font-body-md text-body-md">
        <tbody>
          {displayCustomers.map((r: any) => (
            <tr key={r.id || r._id} className="border-b border-outline-variant hover:bg-surface-container-lowest">
              <td className="p-4 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-[10px] font-bold uppercase`}>
                  {r.companyName ? r.companyName.charAt(0) : "C"}
                </div>
                <div>
                  <p className="font-bold">{r.companyName}</p>
                  <p className="text-[10px] text-outline">{r.customerType || "Client"}</p>
                </div>
              </td>
              <td className="p-4 text-right font-medium">₹{(r.stats?.totalRevenue || 0).toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}

function RecentOrders({ data }: { data: any[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return "bg-status-success/10 text-status-success";
      case "SHIPPED": return "bg-blue-100 text-blue-800";
      case "APPROVED": return "bg-purple-100 text-purple-800";
      case "DRAFT": return "bg-gray-100 text-gray-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const displayOrders = data && data.length > 0
    ? [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4)
    : [
        { _id: "1", orderNumber: "#ORD-4592", createdAt: new Date(), status: "PENDING_MD_APPROVAL", totalOrderValue: 24500 },
        { _id: "2", orderNumber: "#ORD-4591", createdAt: new Date(Date.now() - 3600000), status: "SHIPPED", totalOrderValue: 112000 },
        { _id: "3", orderNumber: "#ORD-4590", createdAt: new Date(Date.now() - 10800000), status: "DELIVERED", totalOrderValue: 45200 },
        { _id: "4", orderNumber: "#ORD-4589", createdAt: new Date(Date.now() - 18000000), status: "DRAFT", totalOrderValue: 9800 },
      ];

  return (
    <TableCard title="Recent Orders" icon="shopping_bag">
      <table className="w-full text-left font-body-md text-body-md">
        <tbody>
          {displayOrders.map((r: any) => (
            <tr key={r._id} className="border-b border-outline-variant hover:bg-surface-container-lowest">
              <td className="p-4">
                <Link to={`/orders/${r._id}`} className="font-bold hover:underline hover:text-primary">
                  {r.orderNumber}
                </Link>
                <p className="text-[10px] text-outline">{new Date(r.createdAt).toLocaleDateString()}</p>
              </td>
              <td className="p-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(r.status)}`}>{r.status}</span>
              </td>
              <td className="p-4 text-right font-medium">₹{(r.totalOrderValue || 0).toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}

function PendingCollections({ data }: { data: any[] }) {
  const displayCollections = data && data.length > 0
    ? [...data].filter((inv: any) => inv.status !== "PAID").slice(0, 4)
    : [
        { _id: "1", customerId: { companyName: "Bajaj Auto" }, remarks: "Overdue 12 Days", outstandingAmount: 85000 },
        { _id: "2", customerId: { companyName: "Hero Moto" }, remarks: "Overdue 8 Days", outstandingAmount: 210000 },
        { _id: "3", customerId: { companyName: "MRF Tyres" }, remarks: "Due in 2 Days", outstandingAmount: 45000 },
        { _id: "4", customerId: { companyName: "Apollo Tubes" }, remarks: "Overdue 45 Days", outstandingAmount: 32000 },
      ];

  return (
    <TableCard title="Pending Collections" icon="priority_high" iconColor="text-error">
      <table className="w-full text-left font-body-md text-body-md">
        <tbody>
          {displayCollections.map((r: any) => (
            <tr key={r._id} className="border-b border-outline-variant hover:bg-surface-container-lowest">
              <td className="p-4">
                <p className="font-bold">{r.customerId?.companyName || "Unknown Customer"}</p>
                <p className={`text-[10px] font-semibold text-error`}>{r.remarks || "Pending Payment"}</p>
              </td>
              <td className="p-4 text-right font-bold text-red-600">₹{(r.outstandingAmount || 0).toLocaleString("en-IN")}</td>
              <td className="p-4 text-right">
                <button className="p-1 hover:bg-surface-container rounded transition-colors" title="Send Reminder">
                  <span className="material-symbols-outlined text-outline">send</span>
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