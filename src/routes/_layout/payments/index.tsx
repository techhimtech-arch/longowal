import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("history");
  
  // Filtering & Search
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [daysFilter, setDaysFilter] = useState("all"); // 'all', 'overdue', 'due2days'
  const [transporterStatusFilter, setTransporterStatusFilter] = useState("");

  // Modal / Form state for recording transporter payment
  const [payingDispatch, setPayingDispatch] = useState<any | null>(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [proofUrlInput, setProofUrlInput] = useState("");

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

  const { data: dispatches = [], isLoading: isLoadingDispatches } = useQuery({
    queryKey: ["payments-dispatches"],
    queryFn: async () => {
      const res = await api.get("/dispatches");
      return res.data?.data || [];
    }
  });

  // Mutator to pay transporter
  const recordTransporterPaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/dispatches/${id}/payment`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments-dispatches"] });
      setPayingDispatch(null);
      setRemarksInput("");
      setProofUrlInput("");
    },
    onError: (err: any) => {
      alert("Failed to record payment: " + (err.message || "Unknown error"));
    }
  });

  const isLoading = isLoadingPayments || isLoadingInvoices || isLoadingDispatches;

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

  // 1. Filter Processed Receipts History (Inflow)
  const filteredPayments = payments.filter((p: any) => {
    const matchesSearch = 
      (p.referenceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.invoiceId?.invoiceNumber || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesCustomer = customerFilter ? p.customerId?._id === customerFilter : true;
    return matchesSearch && matchesCustomer;
  });

  // 2. Filter Pending Invoices (Upcoming Reminders)
  const outstandingInvoices = invoices.filter((inv: any) => {
    if (inv.status === "PAID" || (inv.outstandingAmount || 0) <= 0) return false;

    const matchesSearch = 
      (inv.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.orderId?.orderNumber || "").toLowerCase().includes(search.toLowerCase());

    const matchesCustomer = customerFilter ? inv.customerId?._id === customerFilter : true;
    
    const daysLeft = getRemainingDays(inv.dueDate);

    let matchesDays = true;
    if (daysFilter === "overdue") {
      matchesDays = daysLeft !== null && daysLeft < 0;
    } else if (daysFilter === "due2days") {
      matchesDays = daysLeft !== null && daysLeft >= 0 && daysLeft <= 2;
    }

    return matchesSearch && matchesCustomer && matchesDays;
  });

  // 3. Filter Dispatches with freight costs (Outflow)
  const freightDispatches = dispatches.filter((disp: any) => {
    // Only show dispatches that have some freight cost associated
    if ((disp.freightCost || 0) <= 0) return false;

    const matchesSearch = 
      (disp.dispatchNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (disp.transporterName || "").toLowerCase().includes(search.toLowerCase()) ||
      (disp.vehicleNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (disp.orderId?.orderNumber || "").toLowerCase().includes(search.toLowerCase());

    const matchesCustomer = customerFilter ? disp.customerId?._id === customerFilter : true;
    
    const matchesStatus = transporterStatusFilter ? disp.transporterPaymentStatus === transporterStatusFilter : true;

    return matchesSearch && matchesCustomer && matchesStatus;
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
  dispatches.forEach((disp: any) => {
    if (disp.customerId?._id && disp.customerId?.companyName) {
      uniqueCustomersMap.set(disp.customerId._id, disp.customerId.companyName);
    }
  });
  const customersList = Array.from(uniqueCustomersMap.entries()).map(([id, name]) => ({ id, name }));

  // Dynamic CSV Exporter
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";

    if (activeTab === "history") {
      filename = `Customer_Collections_Export.csv`;
      headers = ["Payment Date", "Customer", "Invoice Number", "Reference #", "Payment Mode", "Amount Received (INR)"];
      rows = filteredPayments.map((p: any) => [
        new Date(p.paymentDate).toLocaleDateString(),
        p.customerId?.companyName || "-",
        p.invoiceId?.invoiceNumber || "-",
        p.referenceNumber || "-",
        p.paymentMode || "-",
        p.amountReceived || 0
      ].map(escapeCSV));
    } else if (activeTab === "reminders") {
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
    } else if (activeTab === "transporter") {
      filename = `Transporter_Outflows_Export.csv`;
      headers = ["Dispatch #", "Dispatch Date", "Transporter", "Vehicle #", "Freight Cost (INR)", "Payment Status", "Paid Date"];
      rows = freightDispatches.map((disp: any) => [
        disp.dispatchNumber,
        new Date(disp.dispatchDate).toLocaleDateString(),
        disp.transporterName || "-",
        disp.vehicleNumber || "-",
        disp.freightCost || 0,
        disp.transporterPaymentStatus,
        disp.transporterPaymentDate ? new Date(disp.transporterPaymentDate).toLocaleDateString() : "-"
      ].map(escapeCSV));
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

  const handleRecordTransporterPayment = () => {
    if (!payingDispatch) return;
    recordTransporterPaymentMutation.mutate({
      id: payingDispatch._id,
      data: {
        transporterPaymentRemarks: remarksInput,
        transporterPaymentProofUrl: proofUrlInput
      }
    });
  };

  // Summaries calculations
  const totalReceivedSum = filteredPayments.reduce((acc, curr) => acc + (curr.amountReceived || 0), 0);
  const outstandingSum = outstandingInvoices.reduce((acc, curr) => acc + (curr.outstandingAmount || 0), 0);
  const transporterOutflowPaid = dispatches
    .filter((disp: any) => disp.transporterPaymentStatus === "PAID")
    .reduce((acc: number, curr: any) => acc + (curr.freightCost || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Payments Dashboard</h1>
          <p className="text-muted-foreground">Reconcile customer inflows, track collection timelines, and record transport outflow expenses.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Collections (Inflow)</h3>
          <p className="text-2xl font-bold mt-1 text-green-600">₹{totalReceivedSum.toLocaleString("en-IN")}</p>
          <span className="text-[11px] text-green-500 font-medium">Billed receipts collected</span>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding Accounts (Receivables)</h3>
          <p className="text-2xl font-bold mt-1 text-red-600">₹{outstandingSum.toLocaleString("en-IN")}</p>
          <span className="text-[11px] text-red-500 font-medium">To be collected</span>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transporter Payments (Outflow)</h3>
          <p className="text-2xl font-bold mt-1 text-orange-600">₹{transporterOutflowPaid.toLocaleString("en-IN")}</p>
          <span className="text-[11px] text-orange-500 font-medium font-semibold">Total freight cost paid</span>
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
            placeholder={
              activeTab === "history" ? "Search invoice # or reference..." : 
              activeTab === "reminders" ? "Search invoice # or order #..." :
              "Search dispatch #, vehicle, or transporter..."
            }
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
        {activeTab === "transporter" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Payment Status</label>
            <select
              value={transporterStatusFilter}
              onChange={(e) => setTransporterStatusFilter(e.target.value)}
              className="border border-input bg-background rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Transporter Payments</option>
              <option value="PENDING">Pending (Unpaid)</option>
              <option value="PAID">Paid</option>
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
            Customer Collections (Inflow)
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
          <button
            onClick={() => setActiveTab("transporter")}
            className={`px-6 py-3 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "transporter"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
            Transporter Payments (Outflow)
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
              {/* Tab 1: Customer Collections Inflow History */}
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

              {/* Tab 3: Transporter Payments (Outflow) */}
              {activeTab === "transporter" && (
                <div className="space-y-4">
                  {freightDispatches.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 italic">No transporter records matching current filters.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt/50 border-b border-wireframe-border">
                          <tr>
                            <th className="py-2.5 px-3">Dispatch #</th>
                            <th className="py-2.5 px-3">Dispatch Date</th>
                            <th className="py-2.5 px-3">Transporter</th>
                            <th className="py-2.5 px-3">Vehicle #</th>
                            <th className="py-2.5 px-3 text-right">Freight Cost</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3">Paid Date</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-wireframe-border">
                          {freightDispatches.map((disp: any) => {
                            const isPaid = disp.transporterPaymentStatus === "PAID";
                            return (
                              <tr key={disp._id} className="hover:bg-wireframe-bg-alt/10 text-sm">
                                <td className="py-2.5 px-3 font-mono text-xs text-secondary-foreground">{disp.dispatchNumber}</td>
                                <td className="py-2.5 px-3 text-muted-foreground">{new Date(disp.dispatchDate).toLocaleDateString()}</td>
                                <td className="py-2.5 px-3 font-semibold">{disp.transporterName || "-"}</td>
                                <td className="py-2.5 px-3 font-mono text-xs">{disp.vehicleNumber}</td>
                                <td className="py-2.5 px-3 text-right font-medium">₹{disp.freightCost?.toLocaleString("en-IN")}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                    isPaid 
                                      ? "bg-green-100 text-green-800 border-green-200" 
                                      : "bg-orange-100 text-orange-800 border-orange-200"
                                  }`}>
                                    {disp.transporterPaymentStatus}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                                  {disp.transporterPaymentDate ? new Date(disp.transporterPaymentDate).toLocaleDateString() : "-"}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  {isPaid ? (
                                    <span className="text-xs text-muted-foreground italic font-medium" title={disp.transporterPaymentRemarks}>
                                      Receipt Logged
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setPayingDispatch(disp)}
                                      className="bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary font-bold px-3 py-1 rounded text-xs transition-all shadow-sm"
                                    >
                                      Record Outflow
                                    </button>
                                  )}
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

      {/* Record Outflow payment Modal overlay */}
      {payingDispatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-wireframe-border p-6 rounded-lg max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-start">
              <h3 className="text-base font-bold text-foreground">Record Transporter Payment</h3>
              <button 
                onClick={() => setPayingDispatch(null)}
                className="text-muted-foreground hover:text-foreground font-bold p-1 text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Confirm cash/bank outflow payment of <strong className="text-foreground">₹{payingDispatch.freightCost?.toLocaleString()}</strong> to transporter <strong>{payingDispatch.transporterName}</strong> for vehicle <strong>{payingDispatch.vehicleNumber}</strong>.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g., Paid via bank transfer, cheque, transaction ID..."
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  className="border border-input bg-background rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Payment Proof URL</label>
                <input
                  type="text"
                  placeholder="e.g., Receipt receipt link or path..."
                  value={proofUrlInput}
                  onChange={(e) => setProofUrlInput(e.target.value)}
                  className="border border-input bg-background rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPayingDispatch(null)}
                className="px-4 py-2 border border-wireframe-border rounded text-xs font-semibold hover:bg-wireframe-bg-alt/30"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordTransporterPayment}
                disabled={recordTransporterPaymentMutation.isPending}
                className="bg-primary text-primary-foreground px-4 py-2 rounded text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {recordTransporterPaymentMutation.isPending && (
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full"></span>
                )}
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
