import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/reports/")({
  component: ReportsDashboard,
});

// Safe CSV value escaper
const escapeCSV = (val: any) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

function ReportsDashboard() {
  const [activeReportTab, setActiveReportTab] = useState("orders");
  
  // Filters State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");

  // Queries
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["reports-orders"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data?.data || [];
    }
  });

  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["reports-invoices"],
    queryFn: async () => {
      const res = await api.get("/finance/invoices");
      return res.data?.data || [];
    }
  });

  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["reports-payments"],
    queryFn: async () => {
      const res = await api.get("/finance/payments");
      return res.data?.data || [];
    }
  });

  const isLoading = isLoadingOrders || isLoadingInvoices || isLoadingPayments;

  // Filter Orders Report
  const filteredOrders = orders.filter((o: any) => {
    const oDate = new Date(o.orderDate || o.createdAt).toISOString().split("T")[0];
    const inDateRange = oDate >= startDate && oDate <= endDate;
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    const matchesCustomer = customerFilter ? o.customerId?._id === customerFilter : true;
    return inDateRange && matchesStatus && matchesCustomer;
  });

  // Filter Outstanding / Invoices Report
  const filteredInvoices = invoices.filter((inv: any) => {
    const invDate = new Date(inv.invoiceDate || inv.createdAt).toISOString().split("T")[0];
    const inDateRange = invDate >= startDate && invDate <= endDate;
    const matchesStatus = statusFilter ? inv.status === statusFilter : true;
    const matchesCustomer = customerFilter ? inv.customerId?._id === customerFilter : true;
    return inDateRange && matchesStatus && matchesCustomer;
  });

  // Filter Payments Report
  const filteredPayments = payments.filter((p: any) => {
    const pDate = new Date(p.paymentDate).toISOString().split("T")[0];
    const inDateRange = pDate >= startDate && pDate <= endDate;
    const matchesCustomer = customerFilter ? p.customerId?._id === customerFilter : true;
    return inDateRange && matchesCustomer;
  });

  // Extract unique customers list for filters
  const uniqueCustomersMap = new Map();
  orders.forEach((o: any) => {
    if (o.customerId?._id && o.customerId?.companyName) {
      uniqueCustomersMap.set(o.customerId._id, o.customerId.companyName);
    }
  });
  const customers = Array.from(uniqueCustomersMap.entries()).map(([id, name]) => ({ id, name }));

  // Export CSV Handlers
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";

    if (activeReportTab === "orders") {
      filename = `Orders_Report_${startDate}_to_${endDate}.csv`;
      headers = ["Order Number", "Order Date", "Customer", "Execution Firm", "Status", "Order Value (INR)", "Advance (INR)"];
      rows = filteredOrders.map((o: any) => [
        o.orderNumber,
        new Date(o.orderDate || o.createdAt).toLocaleDateString(),
        o.customerId?.companyName || "-",
        o.executionFirmId?.firmName || "Not Assigned",
        o.status,
        o.totalOrderValue || 0,
        o.advanceAmount || 0
      ].map(escapeCSV));
    } else if (activeReportTab === "outstanding") {
      filename = `Outstanding_Invoices_${startDate}_to_${endDate}.csv`;
      headers = ["Invoice Number", "Invoice Date", "Due Date", "Customer", "Order Link", "Status", "Total Amount (INR)", "Outstanding Balance (INR)"];
      rows = filteredInvoices.map((inv: any) => [
        inv.invoiceNumber,
        new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString(),
        inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-",
        inv.customerId?.companyName || "-",
        inv.orderId?.orderNumber || "-",
        inv.status,
        inv.invoiceAmount || 0,
        inv.outstandingAmount || 0
      ].map(escapeCSV));
    } else if (activeReportTab === "payments") {
      filename = `Collections_Report_${startDate}_to_${endDate}.csv`;
      headers = ["Payment Date", "Customer", "Linked Invoice", "Payment Mode", "Reference Number", "Amount Received (INR)"];
      rows = filteredPayments.map((p: any) => [
        new Date(p.paymentDate).toLocaleDateString(),
        p.customerId?.companyName || "-",
        p.invoiceId?.invoiceNumber || "-",
        p.paymentMode,
        p.referenceNumber || "-",
        p.amountReceived || 0
      ].map(escapeCSV));
    }

    if (rows.length === 0) {
      alert("No data available to export with current filters.");
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summaries Calculations
  const ordersTotalSum = filteredOrders.reduce((acc, curr) => acc + (curr.totalOrderValue || 0), 0);
  const outstandingTotalSum = filteredInvoices.reduce((acc, curr) => acc + (curr.outstandingAmount || 0), 0);
  const paymentsTotalSum = filteredPayments.reduce((acc, curr) => acc + (curr.amountReceived || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports &amp; Analytics</h1>
          <p className="text-muted-foreground">Download business reports, audit logs, and collection trends.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Current View (CSV)
        </button>
      </div>

      {/* Report Filter Bar */}
      <div className="bg-surface border border-wireframe-border p-4 rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 bg-wireframe-bg-alt/30">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-input bg-background rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-input bg-background rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">Customer</label>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="border border-input bg-background rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {activeReportTab !== "payments" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-input bg-background rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              {activeReportTab === "orders" ? (
                <>
                  <option value="DRAFT">DRAFT</option>
                  <option value="PENDING_MD_APPROVAL">PENDING MD APPROVAL</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="LOGISTICS_PENDING">LOGISTICS PENDING</option>
                  <option value="DISPATCH_READY">DISPATCH READY</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </>
              ) : (
                <>
                  <option value="GENERATED">GENERATED</option>
                  <option value="PARTIAL">PARTIAL</option>
                  <option value="PAID">PAID</option>
                  <option value="OVERDUE">OVERDUE</option>
                </>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-wireframe-border flex bg-wireframe-bg-alt/30">
          {[
            { id: "orders", label: "Orders Report", icon: "shopping_cart" },
            { id: "outstanding", label: "Upcoming & Outstanding Payments", icon: "pending_actions" },
            { id: "payments", label: "Collections Report", icon: "account_balance" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveReportTab(tab.id);
                setStatusFilter(""); // Reset status filter on tab change
              }}
              className={`px-6 py-3 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
                activeReportTab === tab.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground font-medium flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
              Loading reports data...
            </div>
          ) : (
            <>
              {/* Tab 1: Orders Report */}
              {activeReportTab === "orders" && (
                <div className="space-y-6">
                  {/* Local Metrics Bar */}
                  <div className="bg-wireframe-bg-alt/40 border border-wireframe-border rounded p-4 flex gap-8">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Filtered Count</span>
                      <p className="text-xl font-bold text-foreground">{filteredOrders.length}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Value</span>
                      <p className="text-xl font-bold text-foreground">₹{ordersTotalSum.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 italic">No orders found in the selected range.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt/50 border-b border-wireframe-border">
                          <tr>
                            <th className="py-2.5 px-3">Order Number</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Execution Firm</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-wireframe-border">
                          {filteredOrders.map((o: any) => (
                            <tr key={o._id} className="hover:bg-wireframe-bg-alt/10">
                              <td className="py-2.5 px-3">
                                <Link to={`/orders/${o._id}` as any} className="font-bold text-primary hover:underline">
                                  {o.orderNumber}
                                </Link>
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground">
                                {new Date(o.orderDate || o.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-3 font-semibold">{o.customerId?.companyName || "-"}</td>
                              <td className="py-2.5 px-3 text-xs">{o.executionFirmId?.firmName || "Not Assigned"}</td>
                              <td className="py-2.5 px-3">
                                <span className="bg-wireframe-bg-alt border border-wireframe-border px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                                  {o.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-foreground">
                                ₹{o.totalOrderValue?.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Outstanding Report */}
              {activeReportTab === "outstanding" && (
                <div className="space-y-6">
                  {/* Local Metrics Bar */}
                  <div className="bg-wireframe-bg-alt/40 border border-wireframe-border rounded p-4 flex gap-8">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active Invoices</span>
                      <p className="text-xl font-bold text-foreground">{filteredInvoices.length}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Outstanding</span>
                      <p className="text-xl font-bold text-red-600">₹{outstandingTotalSum.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {filteredInvoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 italic">No pending invoices found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt/50 border-b border-wireframe-border">
                          <tr>
                            <th className="py-2.5 px-3">Invoice Number</th>
                            <th className="py-2.5 px-3">Invoice Date</th>
                            <th className="py-2.5 px-3">Due Date</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Linked Order</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Invoice Amount</th>
                            <th className="py-2.5 px-3 text-right">Outstanding</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-wireframe-border">
                          {filteredInvoices.map((inv: any) => {
                            const isOverdue = inv.status === 'OVERDUE' || (inv.dueDate && new Date(inv.dueDate).getTime() < Date.now() && inv.outstandingAmount > 0);
                            return (
                              <tr key={inv._id} className="hover:bg-wireframe-bg-alt/10">
                                <td className="py-2.5 px-3 font-mono font-semibold">{inv.invoiceNumber}</td>
                                <td className="py-2.5 px-3 text-muted-foreground">{new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}</td>
                                <td className="py-2.5 px-3 text-muted-foreground">
                                  {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}
                                </td>
                                <td className="py-2.5 px-3 font-semibold">{inv.customerId?.companyName || "-"}</td>
                                <td className="py-2.5 px-3 font-mono text-xs">{inv.orderId?.orderNumber || "-"}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                                    inv.status === "PAID" ? "bg-green-100 text-green-800 border-green-200" :
                                    isOverdue ? "bg-red-100 text-red-800 border-red-200" :
                                    "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  }`}>
                                    {isOverdue ? "OVERDUE" : inv.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">₹{inv.invoiceAmount?.toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-right font-bold text-red-600">₹{inv.outstandingAmount?.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Payments Report */}
              {activeReportTab === "payments" && (
                <div className="space-y-6">
                  {/* Local Metrics Bar */}
                  <div className="bg-wireframe-bg-alt/40 border border-wireframe-border rounded p-4 flex gap-8">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Payments Collected</span>
                      <p className="text-xl font-bold text-foreground">{filteredPayments.length}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Received</span>
                      <p className="text-xl font-bold text-green-600">₹{paymentsTotalSum.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {filteredPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 italic">No collections recorded in the selected range.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt/50 border-b border-wireframe-border">
                          <tr>
                            <th className="py-2.5 px-3">Receipt ID</th>
                            <th className="py-2.5 px-3">Payment Date</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Invoice #</th>
                            <th className="py-2.5 px-3">Mode</th>
                            <th className="py-2.5 px-3">Reference</th>
                            <th className="py-2.5 px-3 text-right">Amount Received</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-wireframe-border">
                          {filteredPayments.map((p: any) => (
                            <tr key={p._id} className="hover:bg-wireframe-bg-alt/10">
                              <td className="py-2.5 px-3 font-mono text-xs">{p.uuid?.slice(0, 8) || p._id?.slice(-8)}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString()}</td>
                              <td className="py-2.5 px-3 font-semibold">{p.customerId?.companyName || "-"}</td>
                              <td className="py-2.5 px-3 font-mono">{p.invoiceId?.invoiceNumber || "-"}</td>
                              <td className="py-2.5 px-3 text-xs font-semibold">{p.paymentMode}</td>
                              <td className="py-2.5 px-3 text-xs text-muted-foreground">{p.referenceNumber || "-"}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-green-600">
                                ₹{p.amountReceived?.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
