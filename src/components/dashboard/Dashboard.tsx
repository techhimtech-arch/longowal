import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMemo, useState } from "react";

// Status color helper used in logistics dashboard
const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED": return "bg-purple-100 text-purple-800";
    case "LOGISTICS_PENDING": return "bg-blue-100 text-blue-700";
    case "FREIGHT_APPROVAL_PENDING": return "bg-yellow-100 text-yellow-800";
    case "DISPATCH_READY": return "bg-indigo-100 text-indigo-800";
    case "PACKED": return "bg-cyan-100 text-cyan-800";
    case "SHIPPED": return "bg-blue-200 text-blue-900";
    case "DELIVERED": return "bg-green-100 text-green-800";
    case "REJECTED": return "bg-red-100 text-red-800";
    case "DRAFT": return "bg-gray-100 text-gray-700";
    default: return "bg-gray-100 text-gray-600";
  }
};

export function Dashboard() {
  const { user } = useAuth();
  const normalizedRole = (user?.role || "").toLowerCase().replace(/[\s_-]/g, "");
  const isSuperAdminOrAdmin = normalizedRole === "superadmin" || normalizedRole === "admin";
  const isMD = normalizedRole === "md" || normalizedRole === "cmd" || normalizedRole === "managingdirector";
  const isSalesExecutive = normalizedRole === "salesexecutive" || normalizedRole === "sales" || normalizedRole === "orgadmin";
  const isLogistics = normalizedRole === "logistics" || normalizedRole === "logisticsteam";
  const isAccounts = normalizedRole === "accounts" || normalizedRole === "citizen" || normalizedRole === "accountant";

  // Logistics tab state - must be at top level (React hooks rules)
  const [activeLogisticsTab, setActiveLogisticsTab] = useState("newly_assigned");

  // Query all data for calculating real KPIs
  const { data: ordersRes, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data?.data || [];
    }
  });

  const { data: invoicesRes, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await api.get("/finance/invoices");
      return res.data?.data || [];
    }
  });

  const { data: customersRes, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await api.get("/customers");
      return res.data?.data || [];
    }
  });

  const { data: leadsRes, isLoading: isLoadingLeads } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await api.get("/leads");
      return res.data?.data || [];
    }
  });

  const { data: paymentsRes, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await api.get("/finance/payments");
      return res.data?.data || [];
    }
  });

  const { data: dispatchesRes, isLoading: isLoadingDispatches } = useQuery({
    queryKey: ["dispatches"],
    queryFn: async () => {
      const res = await api.get("/dispatches");
      return res.data?.data || [];
    },
    enabled: isLogistics || isSuperAdminOrAdmin || isMD
  });

  const isLoading = isLoadingOrders || isLoadingInvoices || isLoadingCustomers || isLoadingLeads || isLoadingPayments || (isLoadingDispatches && (isLogistics || isSuperAdminOrAdmin || isMD));

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-wireframe-bg-alt text-muted-foreground gap-2">
        <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
        Loading dashboard metrics...
      </div>
    );
  }

  const orders = ordersRes || [];
  const invoices = invoicesRes || [];
  const customers = customersRes || [];
  const leads = leadsRes || [];
  const payments = paymentsRes || [];
  const dispatches = dispatchesRes || [];

  // Calculations & Fallbacks based on data presence
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // ----------------------------------------------------
  // SALES EXECUTIVE DASHBOARD VIEW
  // ----------------------------------------------------
  if (isSalesExecutive) {
    const myOrdersIds = new Set(orders.map((o: any) => o._id.toString()));
    const myInvoices = invoices.filter((inv: any) => myOrdersIds.has(inv.orderId?._id?.toString() || inv.orderId?.toString() || ""));
    
    const totalRevenueVal = myInvoices.reduce((acc: number, curr: any) => acc + (curr.invoiceAmount || 0), 0);
    const monthlyRevenueVal = myInvoices
      .filter((inv: any) => {
        const d = new Date(inv.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc: number, curr: any) => acc + (curr.invoiceAmount || 0), 0);
    const outstandingVal = myInvoices.reduce((acc: number, curr: any) => acc + (curr.outstandingAmount || 0), 0);
    const activeOrdersVal = orders.filter((o: any) => !["DELIVERED", "COMPLETED", "CANCELLED"].includes(o.status)).length;

    return (
      <div className="p-gutter space-y-gutter">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Sales Executive Dashboard</h1>
          <p className="font-body-md text-body-md text-secondary">
            Your performance and assigned order pipeline for {new Date().toLocaleString("default", { month: "short", year: "numeric" })}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface border border-wireframe-border p-5 rounded">
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">My Active Orders</h3>
            <p className="font-headline-md text-headline-md text-on-surface mt-1">{activeOrdersVal}</p>
            <p className="font-label-sm text-label-sm text-outline mt-2">Awaiting completion</p>
          </div>
          <div className="bg-surface border border-wireframe-border p-5 rounded">
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Total Sales Generated</h3>
            <p className="font-headline-md text-headline-md text-on-surface mt-1">₹{totalRevenueVal.toLocaleString("en-IN")}</p>
            <p className="font-label-sm text-label-sm text-outline mt-2">Cumulative value of invoices</p>
          </div>
          <div className="bg-surface border border-wireframe-border p-5 rounded">
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Sales MTD</h3>
            <p className="font-headline-md text-headline-md text-on-surface mt-1">₹{monthlyRevenueVal.toLocaleString("en-IN")}</p>
            <p className="font-label-sm text-label-sm text-outline mt-2">This calendar month</p>
          </div>
          <div className="bg-surface border border-wireframe-border p-5 rounded">
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">My Outstanding Collections</h3>
            <p className="font-headline-md text-headline-md text-on-surface mt-1 text-red-600">₹{outstandingVal.toLocaleString("en-IN")}</p>
            <p className="font-label-sm text-label-sm text-outline mt-2">Unpaid buyer invoices</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrders data={orders} />
          <UpcomingPayments orders={orders} />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LOGISTICS TEAM DASHBOARD VIEW
  // ----------------------------------------------------
  if (isLogistics) {
    const activeAssigned = orders.filter((o: any) => ["APPROVED", "LOGISTICS_PENDING", "FREIGHT_APPROVAL_PENDING", "DISPATCH_READY", "PACKED", "SHIPPED"].includes(o.status));
    
    // Dispatches planned/draft
    const plannedTrips = dispatches.filter((d: any) => d.status === "PLANNED");
    const pendingFreight = dispatches.filter((d: any) => d.status === "FREIGHT_APPROVAL_PENDING");
    const activeTransit = dispatches.filter((d: any) => ["DISPATCHED", "IN_TRANSIT"].includes(d.status));

    // (activeLogisticsTab state is now declared at top level)

    const currentUserId = user?.id || (user as any)?._id || "";
    
    const newlyAssigned = activeAssigned.filter((o: any) => 
      o.viewedBy && !o.viewedBy.some((id: any) => id.toString() === currentUserId.toString())
    );

    const awaitingTripPlanning = activeAssigned.filter((o: any) => 
      ["APPROVED", "LOGISTICS_PENDING"].includes(o.status)
    );

    const awaitingDispatch = activeAssigned.filter((o: any) => 
      o.status === "DISPATCH_READY"
    );

    const awaitingDelivery = activeAssigned.filter((o: any) => 
      o.status === "SHIPPED"
    );

    const highPriority = activeAssigned.filter((o: any) => {
      const isUrgentRemark = o.remarks && /urgent|high|priority|immediate/i.test(o.remarks);
      const isCloseDate = o.requiredDeliveryDate && new Date(o.requiredDeliveryDate).getTime() <= Date.now() + 24 * 60 * 60 * 1000;
      return !!(isUrgentRemark || isCloseDate);
    });

    const getTabOrders = () => {
      switch (activeLogisticsTab) {
        case "newly_assigned": return newlyAssigned;
        case "trip_planning": return awaitingTripPlanning;
        case "dispatch": return awaitingDispatch;
        case "delivery": return awaitingDelivery;
        case "high_priority": return highPriority;
        default: return activeAssigned;
      }
    };

    const tabOrders = [...getTabOrders()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
      <div className="p-gutter space-y-gutter">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Logistics Dashboard</h1>
          <p className="font-body-md text-body-md text-secondary">
            Trips planning, dispatches, and freight approval logs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface border border-wireframe-border p-5 rounded">
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Active Assigned Orders</h3>
            <p className="font-headline-md text-headline-md text-on-surface mt-1">{activeAssigned.length}</p>
            <p className="font-label-sm text-label-sm text-outline mt-2">Orders awaiting dispatches</p>
          </div>
          <div className="bg-surface border border-wireframe-border p-5 rounded">
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Planned Trips</h3>
            <p className="font-headline-md text-headline-md text-on-surface mt-1">{plannedTrips.length}</p>
            <p className="font-label-sm text-label-sm text-outline mt-2">Ready to dispatch</p>
          </div>
          <div className="bg-surface border border-wireframe-border p-5 rounded">
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Freight Pending Approval</h3>
            <p className="font-headline-md text-headline-md text-on-surface mt-1 text-yellow-600">{pendingFreight.length}</p>
            <p className="font-label-sm text-label-sm text-outline mt-2">Awaiting MD response</p>
          </div>
          <div className="bg-surface border border-wireframe-border p-5 rounded">
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">In-Transit Deliveries</h3>
            <p className="font-headline-md text-headline-md text-on-surface mt-1 text-blue-600">{activeTransit.length}</p>
            <p className="font-label-sm text-label-sm text-outline mt-2">Vehicles currently on road</p>
          </div>
        </div>

        {/* My Today's Work Section */}
        <div className="bg-surface border border-wireframe-border rounded overflow-hidden flex flex-col">
          <div className="p-4 bg-wireframe-bg-alt border-b border-wireframe-border flex justify-between items-center">
            <h3 className="font-label-md text-label-md uppercase tracking-tight text-on-surface flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
              My Today's Work / Pending Actions
            </h3>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
              {activeAssigned.length} tasks assigned to me
            </span>
          </div>
          
          <div className="border-b border-wireframe-border flex overflow-x-auto bg-surface-container-lowest">
            {[
              { id: "newly_assigned", label: "Newly Assigned", count: newlyAssigned.length },
              { id: "trip_planning", label: "Awaiting Trip Planning", count: awaitingTripPlanning.length },
              { id: "dispatch", label: "Awaiting Dispatch", count: awaitingDispatch.length },
              { id: "delivery", label: "Awaiting Delivery", count: awaitingDelivery.length },
              { id: "high_priority", label: "High Priority", count: highPriority.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLogisticsTab(tab.id)}
                className={`px-5 py-3 font-semibold text-xs whitespace-nowrap border-b-2 flex items-center gap-2 transition-all ${
                  activeLogisticsTab === tab.id
                    ? "border-primary text-primary bg-primary-container/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-wireframe-bg-alt/25"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    activeLogisticsTab === tab.id ? "bg-primary text-white" : "bg-outline/20 text-outline"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
            {tabOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 italic">
                No orders in this category.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-wireframe-border font-bold text-muted-foreground text-xs uppercase bg-wireframe-bg-alt/20">
                      <th className="py-2.5 px-3">Order Details</th>
                      <th className="py-2.5 px-3">Customer / Firm</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Loading Plant</th>
                      <th className="py-2.5 px-3 text-right">Order Value</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-wireframe-border">
                    {tabOrders.map((o: any) => {
                      const isUnread = newlyAssigned.some((item: any) => item._id === o._id);
                      const isUrgent = highPriority.some((item: any) => item._id === o._id);
                      return (
                        <tr key={o._id} className={`hover:bg-wireframe-bg-alt/5 transition-colors ${isUnread ? 'bg-blue-50/50' : ''}`}>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Link to={`/orders/${o._id}` as any} className="font-bold text-primary hover:underline">
                                {o.orderNumber}
                              </Link>
                              {isUnread && (
                                <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase animate-pulse">
                                  New
                                </span>
                              )}
                              {isUrgent && (
                                <span className="bg-red-100 text-red-800 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border border-red-200">
                                  Urgent
                                </span>
                              )}
                            </div>
                            <span className="block text-[10px] text-muted-foreground mt-0.5">Date: {new Date(o.orderDate || o.createdAt).toLocaleDateString()}</span>
                            {o.requiredDeliveryDate && (
                              <span className="block text-[10px] text-red-600 font-semibold">Req Delivery: {new Date(o.requiredDeliveryDate).toLocaleDateString()}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold block text-foreground">{o.customerId?.companyName || "-"}</span>
                            <span className="text-[11px] text-muted-foreground">{o.executionFirmId?.firmName || "No Execution Firm"}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getStatusColor(o.status)}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-xs">
                            {o.plantName || "-"}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-foreground">
                            ₹{o.totalOrderValue?.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Link
                              to={`/orders/${o._id}` as any}
                              className="inline-block text-xs bg-primary text-primary-foreground font-semibold px-3 py-1 rounded hover:opacity-90 transition-all shadow-sm"
                            >
                              Open Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <TableCard title="Your Trips Today" icon="local_shipping">
            <div className="p-4 space-y-4">
              {dispatches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No dispatches recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-wireframe-border font-bold text-muted-foreground text-xs">
                        <th className="py-2 px-3">Vehicle #</th>
                        <th className="py-2 px-3">Transporter</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Freight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-wireframe-border">
                      {dispatches.slice(0, 5).map((d: any) => (
                        <tr key={d._id} className="hover:bg-wireframe-bg-alt/10">
                          <td className="py-2 px-3">
                            <span className="font-bold">{d.vehicleNumber}</span>
                            <span className="block text-[10px] text-muted-foreground">{d.dispatchNumber}</span>
                          </td>
                          <td className="py-2 px-3">{d.transporterName || "-"}</td>
                          <td className="py-2 px-3">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              d.status === "DELIVERED" ? "bg-green-100 text-green-800" :
                              d.status === "DISPATCHED" ? "bg-blue-100 text-blue-800" :
                              d.status === "FREIGHT_APPROVAL_PENDING" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>{d.status}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-medium">₹{d.freightCost?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TableCard>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ACCOUNTS TEAM DASHBOARD VIEW
  // ----------------------------------------------------
  if (isAccounts) {
    const totalRevenueVal = invoices.reduce((acc: number, curr: any) => acc + (curr.invoiceAmount || 0), 0);
    const outstandingVal = invoices.reduce((acc: number, curr: any) => acc + (curr.outstandingAmount || 0), 0);
    const collectionVal = payments
      .filter((p: any) => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc: number, curr: any) => acc + (curr.amountReceived || 0), 0);

    const pendingInvoicesVal = invoices.filter((inv: any) => inv.status === "PENDING").length;

    return (
      <div className="p-gutter space-y-gutter">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Accounts &amp; Collections Dashboard</h1>
          <p className="font-body-md text-body-md text-secondary">
            Manage customer ledgers, invoices, payments, and outstanding tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface border border-wireframe-border p-5 rounded">
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Total Billing (Revenue)</h3>
            <p className="font-headline-md text-headline-md text-on-surface mt-1">₹{totalRevenueVal.toLocaleString("en-IN")}</p>
            <p className="font-label-sm text-label-sm text-outline mt-2">Cumulative invoices value</p>
          </div>
          <div className="bg-surface border border-wireframe-border p-5 rounded">
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Total Outstanding</h3>
            <p className="font-headline-md text-headline-md text-on-surface mt-1 text-red-600">₹{outstandingVal.toLocaleString("en-IN")}</p>
            <p className="font-label-sm text-label-sm text-outline mt-2">Active outstanding balance</p>
          </div>
          <div className="bg-surface border border-wireframe-border p-5 rounded">
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Collection (MTD)</h3>
            <p className="font-headline-md text-headline-md text-on-surface mt-1 text-green-600">₹{collectionVal.toLocaleString("en-IN")}</p>
            <p className="font-label-sm text-label-sm text-outline mt-2">Collected MTD payments</p>
          </div>
          <div className="bg-surface border border-wireframe-border p-5 rounded">
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Pending Invoices</h3>
            <p className="font-headline-md text-headline-md text-on-surface mt-1 text-yellow-600">{pendingInvoicesVal}</p>
            <p className="font-label-sm text-label-sm text-outline mt-2">Invoices awaiting collection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RecentOrders data={orders} />
          </div>
          <div className="lg:col-span-1">
            <PendingCollections data={invoices} />
          </div>
          <div className="lg:col-span-1">
            <UpcomingPayments orders={orders} />
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MD & SUPER ADMIN MAIN DASHBOARD VIEW
  // ----------------------------------------------------
  const totalRevenueVal = invoices.reduce((acc: number, curr: any) => acc + (curr.invoiceAmount || 0), 0);
  const totalRevenue = `₹${totalRevenueVal.toLocaleString("en-IN")}`;

  const monthlyRevenueVal = invoices
    .filter((inv: any) => {
      const d = new Date(inv.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc: number, curr: any) => acc + (curr.invoiceAmount || 0), 0);
  const monthlyRevenue = `₹${monthlyRevenueVal.toLocaleString("en-IN")}`;

  const outstandingVal = invoices.reduce((acc: number, curr: any) => acc + (curr.outstandingAmount || 0), 0);
  const outstanding = `₹${outstandingVal.toLocaleString("en-IN")}`;

  const activeCustomersVal = customers.length.toString();
  const activeOrdersVal = orders.filter((o: any) => !["DELIVERED", "COMPLETED", "CANCELLED"].includes(o.status)).length;
  const dispatchesVal = orders.filter((o: any) => ["SHIPPED", "DISPATCH_READY"].includes(o.status)).length;

  const collectionVal = payments
    .filter((p: any) => {
      const d = new Date(p.paymentDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc: number, curr: any) => acc + (curr.amountReceived || 0), 0);
  const collectionMtd = `₹${collectionVal.toLocaleString("en-IN")}`;
  const newLeadsVal = leads.filter((l: any) => l.status === "New").length;

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
        <KpiTrend icon="groups" iconBg="bg-surface-container-high" iconColor="text-on-surface" label="Active Customers" value={activeCustomersVal} trend="22" trendUp meta="Across 14 Regions" />

        {/* Row 2 */}
        <div className="bg-surface border border-wireframe-border p-5 rounded hover:shadow-sm transition-shadow">
          <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Active Orders</h3>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">{activeOrdersVal}</p>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-primary h-full w-[65%]" />
          </div>
          <p className="font-label-sm text-label-sm text-outline mt-2">65% Fulfillment Rate</p>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded hover:shadow-sm transition-shadow">
          <h3 className="font-label-md text-label-md text-secondary uppercase tracking-tight">Dispatches Today</h3>
          <p className="font-headline-md text-headline-md text-on-surface mt-1">{dispatchesVal}</p>
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
          <p className="font-headline-md text-headline-md text-on-surface mt-1">{newLeadsVal}</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <TopCustomers data={customers} />
        <RecentOrders data={orders} />
        <PendingCollections data={invoices} />
        <UpcomingPayments orders={orders} />
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
    : [];

  return (
    <TableCard title="Top Customers" icon="group">
      <table className="w-full text-left font-body-md text-body-md">
        <tbody>
          {displayCustomers.length === 0 ? (
            <tr>
              <td className="p-4 text-center text-muted-foreground">No customer stats.</td>
            </tr>
          ) : (
            displayCustomers.map((r: any) => (
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
            ))
          )}
        </tbody>
      </table>
    </TableCard>
  );
}

function RecentOrders({ data }: { data: any[] }) {
  const { user } = useAuth();
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return "bg-status-success/10 text-status-success border border-status-success/20";
      case "SHIPPED": return "bg-blue-100 text-blue-800 border border-blue-200";
      case "APPROVED": return "bg-purple-100 text-purple-800 border border-purple-200";
      case "DRAFT": return "bg-gray-100 text-gray-800 border border-gray-200";
      default: return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    }
  };

  const displayOrders = data && data.length > 0
    ? [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4)
    : [];

  return (
    <TableCard title="Recent Orders" icon="shopping_bag">
      <table className="w-full text-left font-body-md text-body-md">
        <tbody>
          {displayOrders.length === 0 ? (
            <tr>
              <td className="p-4 text-center text-muted-foreground animate-pulse">No orders found.</td>
            </tr>
          ) : (
            displayOrders.map((r: any) => {
              const isUnread = user && r.viewedBy && !r.viewedBy.some((id: any) => id.toString() === (user.id || user._id || "").toString());
              return (
                <tr key={r._id} className={`border-b border-outline-variant hover:bg-surface-container-lowest transition-colors ${isUnread ? 'bg-blue-50/70' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/orders/${r._id}`} className="font-bold hover:underline hover:text-primary transition-all">
                        {r.orderNumber}
                      </Link>
                      {isUnread && (
                        <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase animate-pulse">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-outline">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="p-4 text-right font-medium">₹{(r.totalOrderValue || 0).toLocaleString("en-IN")}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </TableCard>
  );
}

function PendingCollections({ data }: { data: any[] }) {
  const displayCollections = data && data.length > 0
    ? [...data].filter((inv: any) => inv.status !== "PAID").slice(0, 4)
    : [];

  return (
    <TableCard title="Pending Collections" icon="priority_high" iconColor="text-error">
      <table className="w-full text-left font-body-md text-body-md">
        <tbody>
          {displayCollections.length === 0 ? (
            <tr>
              <td className="p-4 text-center text-muted-foreground">No pending collections.</td>
            </tr>
          ) : (
            displayCollections.map((r: any) => (
              <tr key={r._id} className="border-b border-outline-variant hover:bg-surface-container-lowest">
                <td className="p-4">
                  <p className="font-bold">{r.customerId?.companyName || "Unknown Customer"}</p>
                  <p className="text-[10px] font-semibold text-error">Invoice: {r.invoiceNumber}</p>
                </td>
                <td className="p-4 text-right font-bold text-red-600">₹{(r.outstandingAmount || 0).toLocaleString("en-IN")}</td>
                <td className="p-4 text-right">
                  <button className="p-1 hover:bg-surface-container rounded transition-colors" title="Send Reminder">
                    <span className="material-symbols-outlined text-outline">send</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableCard>
  );
}

function UpcomingPayments({ orders }: { orders: any[] }) {
  const filtered = orders
    .filter((o: any) => o.paymentStatus !== "PAID" && o.expectedPaymentDate)
    .sort((a: any, b: any) => new Date(a.expectedPaymentDate).getTime() - new Date(b.expectedPaymentDate).getTime())
    .slice(0, 5);

  const getDueText = (dateStr: string) => {
    const due = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    due.setHours(0,0,0,0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return "Due Today";
    if (diffDays === 1) return "Due Tomorrow";
    return `Due in ${diffDays} days`;
  };

  return (
    <TableCard title="Expected Payments (This Week)" icon="schedule" iconColor="text-primary">
      <table className="w-full text-left font-body-md text-body-md">
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td className="p-4 text-center text-muted-foreground">No upcoming expected payments.</td>
            </tr>
          ) : (
            filtered.map((o: any) => {
              const overdue = new Date(o.expectedPaymentDate).getTime() < Date.now();
              return (
                <tr key={o._id} className="border-b border-outline-variant hover:bg-surface-container-lowest">
                  <td className="p-4">
                    <Link to={`/orders/${o._id}`} className="font-bold text-foreground hover:text-primary transition-colors">
                      {o.customerId?.companyName || "Unknown Customer"}
                    </Link>
                    <div className="flex gap-1.5 items-center mt-1">
                      <span className="text-[10px] text-muted-foreground font-semibold">{o.orderNumber}</span>
                      <span className={`text-[10px] font-bold uppercase ${overdue ? 'text-red-600' : 'text-primary'}`}>
                        • {getDueText(o.expectedPaymentDate)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <p className="font-bold text-foreground">₹{(o.balanceAmount || 0).toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Due: {new Date(o.expectedPaymentDate).toLocaleDateString()}</p>
                  </td>
                </tr>
              );
            })
          )}
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