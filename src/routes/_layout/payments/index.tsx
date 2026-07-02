import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/payments/")({
  component: PaymentsDashboard,
});

// Safe CSV value escaper
const escapeCSV = (val: any) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

function PaymentsDashboard() {
  const [activeTab, setActiveTab] = useState("history");
  
  // Filtering & Search
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [daysFilter, setDaysFilter] = useState("all"); // 'all', 'overdue', 'due2days'

  // Queries
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["payments-receipts"],
    queryFn: async () => {
      const res = await api.get("/finance/payments");
      return res.data?.data || [];
    }
  });

  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["payments-invoices"],
    queryFn: async () => {
      const res = await api.get("/finance/invoices");
      return res.data?.data || [];
    }
  });

  const isLoading = isLoadingPayments || isLoadingInvoices;

  // Calculate days remaining helper
  const getRemainingDays = (dueDateStr: string) => {
    if (!dueDateStr) return null;
    const dueDate = new Date(dueDateStr);
    const now = new Date();
    dueDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - now.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // 1. Filter Processed Receipts History
  const filteredPayments = payments.filter((p: any) => {
    const matchesSearch = 
      (p.referenceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.invoiceId?.invoiceNumber || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesCustomer = customerFilter ? p.customerId?._id === customerFilter : true;
    return matchesSearch && matchesCustomer;
  });

  // 2. Filter Pending Invoices (Upcoming Reminders)
  const outstandingInvoices = invoices.filter((inv: any) => {
    // Only show unpaid or partially paid invoices with active outstanding amount
    if (inv.status === "PAID" || (inv.outstandingAmount || 0) <= 0) return false;

    const matchesSearch = 
      (inv.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.orderId?.orderNumber || "").toLowerCase().includes(search.toLowerCase());

    const matchesCustomer = customerFilter ? inv.customerId?._id === customerFilter : true;
    
    const daysLeft = getRemainingDays(inv.dueDate);

    // Apply countdown ranges
    let matchesDays = true;
    if (daysFilter === "overdue") {
      matchesDays = daysLeft !== null && daysLeft < 0;
    } else if (daysFilter === "due2days") {
      matchesDays = daysLeft !== null && daysLeft >= 0 && daysLeft <= 2;
    }

    return matchesSearch && matchesCustomer && matchesDays;
  });

  // Extract unique customers
  const uniqueCustomersMap = new Map();
  payments.forEach((p: any) => {
    if (p.customerId?._id && p.customerId?.companyName) {
      uniqueCustomersMap.set(p.customerId._id, p.customerId.companyName);
    }
  });
  invoices.forEach((inv: any) => {
    if (inv.customerId?._id && inv.customerId?.companyName) {
      uniqueCustomersMap.set(inv.customerId._id, inv.customerId.companyName);
    }
  });
  const customersList = Array.from(uniqueCustomersMap.entries()).map(([id, name]) => ({ id, name }));

  // Dynamic CSV Exporter
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";

    if (activeTab === "history") {
      filename = `Recorded_Payments_Export.csv`;
      headers = ["Payment Date", "Customer", "Invoice Number", "Reference #", "Payment Mode", "Amount Received (INR)"];
      rows = filteredPayments.map((p: any) => [
        new Date(p.paymentDate).toLocaleDateString(),
        p.customerId?.companyName || "-",
        p.invoiceId?.invoiceNumber || "-",
        p.referenceNumber || "-",
        p.paymentMode || "-",
        p.amountReceived || 0
      ].map(escapeCSV));
    } else {
      filename = `Collection_Reminders_Export.csv`;
      headers = ["Invoice Number", "Due Date", "Customer", "Days Remaining", "Invoice Value (INR)", "Outstanding Balance (INR)", "Status"];
      rows = outstandingInvoices.map((inv: any) => {
        const daysLeft = getRemainingDays(inv.dueDate);
        const countdownText = daysLeft === null ? "-" :
                              daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` :
                              daysLeft === 0 ? "Due today" :
                              `${daysLeft} days remaining`;
        return [
          inv.invoiceNumber,
          inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-",
          inv.customerId?.companyName || "-",
          countdownText,
          inv.invoiceAmount || 0,
          inv.outstandingAmount || 0,
          inv.status
        ];
      }).map(row => row.map(escapeCSV));
    }

    if (rows.length === 0) {
      alert("No records to export.");
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

  // Summaries calculations
  const totalReceivedSum = filteredPayments.reduce((acc, curr) => acc + (curr.amountReceived || 0), 0);
  const outstandingSum = outstandingInvoices.reduce((acc, curr) => acc + (curr.outstandingAmount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Payments Dashboard</h1>
          <p className="text-muted-foreground">Monitor recorded receipts, track upcoming collections, and check payment statuses.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export to CSV
        </button>
      </div>

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Processed Payments</h3>
          <p className="text-2xl font-bold mt-1 text-foreground">₹{totalReceivedSum.toLocaleString("en-IN")}</p>
          <span className="text-[11px] text-green-600 font-medium">Billed receipts collected</span>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Outstanding Invoices</h3>
          <p className="text-2xl font-bold mt-1 text-red-600">₹{outstandingSum.toLocaleString("en-IN")}</p>
          <span className="text-[11px] text-red-500 font-medium">To be collected</span>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Reminders (48h)</h3>
          <p className="text-2xl font-bold mt-1 text-blue-600">
            {invoices.filter((inv: any) => {
              const dl = getRemainingDays(inv.dueDate);
              return inv.status !== "PAID" && (inv.outstandingAmount || 0) > 0 && dl !== null && dl >= 0 && dl <= 2;
            }).length}
          </p>
          <span className="text-[11px] text-blue-500 font-medium">Immediate collection target</span>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-surface border border-wireframe-border p-4 rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 bg-wireframe-bg-alt/30">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">Search</label>
          <input
            type="text"
            placeholder={activeTab === "history" ? "Search invoice # or reference..." : "Search invoice # or order #..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            {customersList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {activeTab === "reminders" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Expected Countdown</label>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(e.target.value)}
              className="border border-input bg-background rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Pending Collections</option>
              <option value="due2days">Due within next 2 days (48 Hours)</option>
              <option value="overdue">Overdue Invoices</option>
            </select>
          </div>
        )}
      </div>

      {/* Content Tabs */}
      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-wireframe-border flex bg-wireframe-bg-alt/30">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "history"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            Recorded Receipts History
          </button>
          <button
            onClick={() => setActiveTab("reminders")}
            className={`px-6 py-3 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "reminders"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">notification_important</span>
            Upcoming Collection Reminders
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground font-medium flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
              Loading payment data...
            </div>
          ) : (
            <>
              {/* Tab 1: Recorded Payments History */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  {filteredPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 italic">No recorded payments found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt/50 border-b border-wireframe-border">
                          <tr>
                            <th className="py-2.5 px-3">Receipt ID</th>
                            <th className="py-2.5 px-3">Payment Date</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Invoice Number</th>
                            <th className="py-2.5 px-3">Mode</th>
                            <th className="py-2.5 px-3">Reference Number</th>
                            <th className="py-2.5 px-3 text-right">Amount Received</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-wireframe-border">
                          {filteredPayments.map((p: any) => (
                            <tr key={p._id} className="hover:bg-wireframe-bg-alt/10">
                              <td className="py-2.5 px-3 font-mono text-xs text-secondary-foreground">{p.uuid?.slice(0, 8) || p._id?.slice(-8)}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString()}</td>
                              <td className="py-2.5 px-3 font-semibold text-foreground">{p.customerId?.companyName || "-"}</td>
                              <td className="py-2.5 px-3 font-mono font-semibold">{p.invoiceId?.invoiceNumber || "-"}</td>
                              <td className="py-2.5 px-3 text-xs font-semibold">{p.paymentMode}</td>
                              <td className="py-2.5 px-3 text-xs text-muted-foreground">{p.referenceNumber || "-"}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-green-600">
                                ₹{p.amountReceived?.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Upcoming Reminders / Countdown */}
              {activeTab === "reminders" && (
                <div className="space-y-4">
                  {outstandingInvoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 italic">No upcoming collections matching current filters.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt/50 border-b border-wireframe-border">
                          <tr>
                            <th className="py-2.5 px-3">Invoice Number</th>
                            <th className="py-2.5 px-3">Due Date</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Linked Order</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Expected Countdown</th>
                            <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-wireframe-border">
                          {outstandingInvoices.map((inv: any) => {
                            const daysLeft = getRemainingDays(inv.dueDate);
                            
                            // Countdown badge styles
                            let badgeStyle = "bg-blue-100 text-blue-800 border-blue-200";
                            let countdownText = "";

                            if (daysLeft === null) {
                              countdownText = "No due date set";
                              badgeStyle = "bg-gray-100 text-gray-800 border-gray-200";
                            } else if (daysLeft < 0) {
                              countdownText = `${Math.abs(daysLeft)} days overdue`;
                              badgeStyle = "bg-red-100 text-red-800 border-red-200 font-bold animate-pulse";
                            } else if (daysLeft === 0) {
                              countdownText = "Due TODAY";
                              badgeStyle = "bg-yellow-100 text-yellow-800 border-yellow-200 font-bold";
                            } else if (daysLeft <= 2) {
                              countdownText = `${daysLeft} days remaining`;
                              badgeStyle = "bg-orange-100 text-orange-800 border-orange-200 font-semibold";
                            } else {
                              countdownText = `${daysLeft} days left`;
                              badgeStyle = "bg-gray-100 text-gray-800 border-gray-200";
                            }

                            return (
                              <tr key={inv._id} className="hover:bg-wireframe-bg-alt/10">
                                <td className="py-2.5 px-3 font-mono font-semibold">{inv.invoiceNumber}</td>
                                <td className="py-2.5 px-3 text-muted-foreground">
                                  {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-foreground">{inv.customerId?.companyName || "-"}</td>
                                <td className="py-2.5 px-3 font-mono text-xs">{inv.orderId?.orderNumber || "-"}</td>
                                <td className="py-2.5 px-3 text-xs">
                                  <span className="bg-wireframe-bg border border-wireframe-border px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${badgeStyle}`}>
                                    {countdownText}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-red-600">
                                  ₹{inv.outstandingAmount?.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            );
                          })}
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
