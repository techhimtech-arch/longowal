import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/customers/$customerId/")({
  component: CustomerDetail,
});

const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED": return "bg-purple-100 text-purple-800 border-purple-200";
    case "LOGISTICS_PENDING": return "bg-blue-100 text-blue-700 border-blue-200";
    case "FREIGHT_APPROVAL_PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "DISPATCH_READY": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "PACKED": return "bg-cyan-100 text-cyan-800 border-cyan-200";
    case "SHIPPED": return "bg-blue-200 text-blue-900 border-blue-300";
    case "DELIVERED": return "bg-green-100 text-green-800 border-green-200";
    case "COMPLETED": return "bg-green-200 text-green-900 border-green-300";
    case "REJECTED": return "bg-red-100 text-red-800 border-red-200";
    case "DRAFT": return "bg-gray-100 text-gray-700 border-gray-200";
    default: return "bg-gray-100 text-gray-600";
  }
};

function CustomerDetail() {
  const { customerId } = Route.useParams();
  const [activeTab, setActiveTab] = useState("overview");

  // Query Customer Details
  const { data: customer, isLoading: isLoadingCust, error: errCust } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const res = await api.get(`/customers/${customerId}`);
      return res.data?.data;
    }
  });

  // Query Customer Orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: async () => {
      const res = await api.get(`/orders?customerId=${customerId}`);
      return res.data?.data || [];
    }
  });

  // Query Customer Invoices
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["customer-invoices", customerId],
    queryFn: async () => {
      const res = await api.get(`/finance/invoices?customerId=${customerId}`);
      return res.data?.data || [];
    }
  });

  // Query Customer Payments
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["customer-payments", customerId],
    queryFn: async () => {
      const res = await api.get(`/finance/payments?customerId=${customerId}`);
      return res.data?.data || [];
    }
  });

  const isLoading = isLoadingCust || isLoadingOrders || isLoadingInvoices || isLoadingPayments;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-wireframe-bg-alt text-muted-foreground gap-2">
        <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
        Loading customer profile...
      </div>
    );
  }

  if (errCust || !customer) {
    return (
      <div className="p-6 text-center text-red-600 font-bold">
        Error loading customer profiles or customer not found.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Profile Section */}
      <div className="bg-surface border border-wireframe-border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary text-white flex items-center justify-center font-bold text-xl uppercase rounded-lg shadow-inner">
            {customer.companyName?.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{customer.companyName}</h1>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                customer.status === "ACTIVE" ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {customer.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Code: <span className="font-mono font-bold text-foreground">{customer.customerCode}</span> | Category: <span className="font-semibold text-secondary-foreground">{customer.customerCategory || "Standard"}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/customers"
            className="border border-wireframe-border bg-surface hover:bg-wireframe-bg-alt px-4 py-2 rounded text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Customers
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</h3>
            <p className="text-xl font-bold mt-1 text-foreground">₹{(customer.stats?.totalRevenue || 0).toLocaleString("en-IN")}</p>
          </div>
          <span className="material-symbols-outlined text-[36px] text-primary/10">payments</span>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding Balance</h3>
            <p className="text-xl font-bold mt-1 text-red-600">₹{(customer.stats?.outstandingAmount || 0).toLocaleString("en-IN")}</p>
          </div>
          <span className="material-symbols-outlined text-[36px] text-red-600/10">account_balance_wallet</span>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</h3>
            <p className="text-xl font-bold mt-1 text-foreground">{orders.length || customer.stats?.totalOrders}</p>
          </div>
          <span className="material-symbols-outlined text-[36px] text-secondary/10">shopping_bag</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-wireframe-border flex bg-wireframe-bg-alt/30">
          {[
            { id: "overview", label: "Profile Overview", icon: "badge" },
            { id: "orders", label: `Orders (${orders.length})`, icon: "shopping_cart" },
            { id: "invoices", label: `Invoices (${invoices.length})`, icon: "description" },
            { id: "payments", label: `Payments (${payments.length})`, icon: "receipt_long" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
                activeTab === tab.id
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
          {/* Tab 1: Profile Overview */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-wireframe-border pb-2">Business & Contact Info</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">GST Number</span>
                    <span className="font-medium">{customer.gstNumber || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">PAN Number</span>
                    <span className="font-medium">{customer.panNumber || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Primary Contact Name</span>
                    <span className="font-medium">{customer.primaryContact?.name || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Primary Contact Phone</span>
                    <span className="font-medium">{customer.primaryContact?.mobile || "-"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">Primary Contact Email</span>
                    <span className="font-medium">{customer.primaryContact?.email || "-"}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-foreground border-b border-wireframe-border pt-4 pb-2">Commercial Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Credit Limit</span>
                    <span className="font-semibold text-foreground">₹{(customer.creditLimit || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Payment Terms</span>
                    <span className="font-medium">{customer.paymentTerms || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-wireframe-border pb-2">Address Info</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block font-bold">Billing Address</span>
                    <p className="mt-1 text-foreground leading-relaxed">
                      {customer.billingAddress?.line1}<br />
                      {customer.billingAddress?.line2 && <>{customer.billingAddress.line2}<br /></>}
                      {customer.billingAddress?.city}, {customer.billingAddress?.state} - {customer.billingAddress?.pincode}<br />
                      {customer.billingAddress?.country}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-bold">Shipping Address</span>
                    <p className="mt-1 text-foreground leading-relaxed">
                      {customer.shippingAddress?.line1 || customer.billingAddress?.line1}<br />
                      {customer.shippingAddress?.line2 && <>{customer.shippingAddress.line2}<br /></>}
                      {customer.shippingAddress?.city || customer.billingAddress?.city}, {customer.shippingAddress?.state || customer.billingAddress?.state} - {customer.shippingAddress?.pincode || customer.billingAddress?.pincode}<br />
                      {customer.shippingAddress?.country || customer.billingAddress?.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Orders list */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 italic">No orders recorded for this customer.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt/50 border-b border-wireframe-border">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Order Number</th>
                        <th className="py-3 px-4 font-semibold">Order Date</th>
                        <th className="py-3 px-4 font-semibold">Execution Firm</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Order Value</th>
                        <th className="py-3 px-4 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-wireframe-border">
                      {orders.map((o: any) => (
                        <tr key={o._id} className="hover:bg-wireframe-bg-alt/20 transition-colors">
                          <td className="py-3 px-4">
                            <Link to={`/orders/${o._id}` as any} className="font-bold text-primary hover:underline">
                              {o.orderNumber}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(o.orderDate || o.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">
                            {o.executionFirmId?.firmName || "Not Assigned"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${getStatusColor(o.status)}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-foreground">
                            ₹{(o.totalOrderValue || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link
                              to={`/orders/${o._id}` as any}
                              className="text-xs text-primary font-semibold hover:underline"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Invoices list */}
          {activeTab === "invoices" && (
            <div className="space-y-4">
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 italic">No invoices issued for this customer.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt/50 border-b border-wireframe-border">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Invoice Number</th>
                        <th className="py-3 px-4 font-semibold">Invoice Date</th>
                        <th className="py-3 px-4 font-semibold">Due Date</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Amount</th>
                        <th className="py-3 px-4 font-semibold text-right">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-wireframe-border">
                      {invoices.map((inv: any) => {
                        const isOverdue = inv.status === 'OVERDUE' || (inv.dueDate && new Date(inv.dueDate).getTime() < Date.now() && inv.outstandingAmount > 0);
                        return (
                          <tr key={inv._id} className="hover:bg-wireframe-bg-alt/20 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-foreground">{inv.invoiceNumber}</td>
                            <td className="py-3 px-4 text-muted-foreground">{new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                                inv.status === "PAID" ? "bg-green-100 text-green-800 border-green-200" :
                                isOverdue ? "bg-red-100 text-red-800 border-red-200" :
                                "bg-yellow-100 text-yellow-800 border-yellow-200"
                              }`}>
                                {isOverdue ? "OVERDUE" : inv.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium">₹{(inv.invoiceAmount || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-bold text-red-600">₹{(inv.outstandingAmount || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Payments list */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 italic">No payments recorded for this customer.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt/50 border-b border-wireframe-border">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Receipt ID</th>
                        <th className="py-3 px-4 font-semibold">Payment Date</th>
                        <th className="py-3 px-4 font-semibold">Invoice Number</th>
                        <th className="py-3 px-4 font-semibold">Mode</th>
                        <th className="py-3 px-4 font-semibold">Reference</th>
                        <th className="py-3 px-4 font-semibold text-right">Amount Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-wireframe-border">
                      {payments.map((p: any) => (
                        <tr key={p._id} className="hover:bg-wireframe-bg-alt/20 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs font-semibold">{p.uuid?.slice(0, 8) || p._id?.slice(-8)}</td>
                          <td className="py-3 px-4 text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-mono font-semibold">{p.invoiceId?.invoiceNumber || "-"}</td>
                          <td className="py-3 px-4 font-semibold text-xs">{p.paymentMode}</td>
                          <td className="py-3 px-4 text-muted-foreground">{p.referenceNumber || "-"}</td>
                          <td className="py-3 px-4 text-right font-bold text-green-600">
                            ₹{(p.amountReceived || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
