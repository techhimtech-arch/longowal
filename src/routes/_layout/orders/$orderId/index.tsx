import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/orders/$orderId/")({
  component: OrderDetail,
});

function OrderDetail() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Edit Logistics form state
  const [isEditingLogistics, setIsEditingLogistics] = useState(false);
  const [transporterName, setTransporterName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverMobile, setDriverMobile] = useState("");
  const [freightCost, setFreightCost] = useState(0);
  const [loadingCharges, setLoadingCharges] = useState(0);
  const [lrNumber, setLrNumber] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");

  // Record Payment form state
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState("BANK_TRANSFER");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");

  // Status transition remarks
  const [statusRemarks, setStatusRemarks] = useState("");
  const [isShowingStatusModal, setIsShowingStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState("");

  // Fetch single order details
  const { data: orderResponse, isLoading: isLoadingOrder, error: orderError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}`);
      return res.data;
    },
  });

  const order = orderResponse?.data;

  // Fetch Invoices and Payments client-side filtering
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await api.get("/finance/invoices");
      return res.data?.data || [];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await api.get("/finance/payments");
      return res.data?.data || [];
    },
  });

  const orderInvoices = invoices.filter((inv: any) => {
    const invOrderId = inv.orderId?._id || inv.orderId;
    return invOrderId === orderId;
  });

  const invoiceIds = orderInvoices.map((inv: any) => inv._id);
  const orderPayments = payments.filter((pay: any) => {
    const payInvId = pay.invoiceId?._id || pay.invoiceId;
    return invoiceIds.includes(payInvId);
  });

  // Calculate outstanding
  const outstandingSummary = useMemoOutstanding(orderInvoices);

  // Initialize logistics edit values
  const startLogisticsEdit = () => {
    if (order?.logistics) {
      setTransporterName(order.logistics.transporterName || "");
      setVehicleNumber(order.logistics.vehicleNumber || "");
      setDriverName(order.logistics.driverName || "");
      setDriverMobile(order.logistics.driverMobile || "");
      setFreightCost(order.logistics.freightCost || 0);
      setLoadingCharges(order.logistics.loadingCharges || 0);
      setLrNumber(order.logistics.lrNumber || "");
      setDispatchDate(order.logistics.dispatchDate ? new Date(order.logistics.dispatchDate).toISOString().split("T")[0] : "");
      setExpectedDeliveryDate(order.logistics.expectedDeliveryDate ? new Date(order.logistics.expectedDeliveryDate).toISOString().split("T")[0] : "");
    }
    setIsEditingLogistics(true);
  };

  // Mutation for updating logistics details
  const logisticsMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        logistics: {
          transporterName,
          vehicleNumber,
          driverName,
          driverMobile,
          freightCost,
          loadingCharges,
          lrNumber,
          dispatchDate: dispatchDate ? new Date(dispatchDate).toISOString() : undefined,
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : undefined,
        },
        status: "DISPATCH_READY",
      };
      const res = await api.put(`/orders/${orderId}/logistics`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Logistics transport details updated successfully!");
      setIsEditingLogistics(false);
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update logistics");
    }
  });

  // Mutation for updating order status
  const statusMutation = useMutation({
    mutationFn: async ({ status, remarks }: { status: string; remarks?: string }) => {
      const res = await api.put(`/orders/${orderId}/status`, { status, remarks });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Order status updated to ${variables.status}`);
      setIsShowingStatusModal(false);
      setStatusRemarks("");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  });

  // Mutation for generating invoice
  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        orderId,
        invoiceAmount: order.totalOrderValue,
        remarks: `Auto-generated invoice for Order ${order.orderNumber}`
      };
      const res = await api.post("/finance/invoices", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Invoice generated successfully!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to generate invoice");
    }
  });

  // Mutation for recording payment
  const paymentMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        invoiceId: paymentInvoiceId,
        amountReceived: paymentAmount,
        paymentDate: new Date(paymentDate).toISOString(),
        paymentMode,
        referenceNumber: paymentRef,
        remarks: paymentRemarks,
        status: "SUCCESS"
      };
      const res = await api.post("/finance/payments", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Payment recorded successfully!");
      setIsRecordingPayment(false);
      setPaymentAmount(0);
      setPaymentRef("");
      setPaymentRemarks("");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record payment");
    }
  });

  const triggerStatusChange = (status: string) => {
    setTargetStatus(status);
    setIsShowingStatusModal(true);
  };

  const submitStatusChange = () => {
    statusMutation.mutate({ status: targetStatus, remarks: statusRemarks });
  };

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wireframe-bg-alt text-muted-foreground gap-2">
        <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
        Loading order details...
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="p-6 text-center text-red-600 font-medium">
        Error loading order details: {(orderError as any)?.message || "Order not found."}
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "logistics", label: "Logistics Desk" },
    { id: "dispatch", label: "Dispatch Copy" },
    { id: "invoice", label: "Invoice & Payments" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-wireframe-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/orders" className="hover:text-foreground">Orders</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{order.orderNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 border-green-200' :
              order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              order.status === 'APPROVED' ? 'bg-purple-100 text-purple-800 border-purple-200' :
              order.status === 'DRAFT' ? 'bg-gray-100 text-gray-800 border-gray-200' :
              'bg-yellow-100 text-yellow-800 border-yellow-200'
            }`}>
              {order.status}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">Submitted on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Action Controls based on Roles / Status */}
        <div className="flex flex-wrap gap-2">
          {order.status === "DRAFT" && (
            <button
              onClick={() => statusMutation.mutate({ status: "PENDING_MD_APPROVAL", remarks: "Submitting draft for approval" })}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
            >
              Submit for Approval
            </button>
          )}

          {order.status === "PENDING_MD_APPROVAL" && (user?.role === "Admin" || user?.role === "Operations") && (
            <>
              <button
                onClick={() => triggerStatusChange("APPROVED")}
                className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md font-medium"
              >
                Approve Order
              </button>
              <button
                onClick={() => triggerStatusChange("REJECTED")}
                className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md font-medium"
              >
                Reject
              </button>
            </>
          )}

          {order.status === "APPROVED" && (
            <button
              onClick={() => statusMutation.mutate({ status: "LOGISTICS_PENDING", remarks: "Sending to logistics desk" })}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
            >
              Send to Logistics Desk
            </button>
          )}

          {order.status === "DISPATCH_READY" && (
            <button
              onClick={() => statusMutation.mutate({ status: "SHIPPED", remarks: "Vehicle dispatched" })}
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium"
            >
              Mark Dispatched / Shipped
            </button>
          )}

          {order.status === "SHIPPED" && (
            <button
              onClick={() => statusMutation.mutate({ status: "DELIVERED", remarks: "Delivered successfully" })}
              className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md font-medium"
            >
              Mark Delivered
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-wireframe-border mb-6 flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-wireframe-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Ordered Products */}
              <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium">
                  Ordered Products
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-wireframe-bg-alt/30 border-b border-wireframe-border text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium">Rate</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.products?.map((item: any, idx: number) => (
                      <tr key={item._id || idx} className="border-b border-wireframe-border">
                        <td className="px-4 py-3 font-medium">{item.productName}</td>
                        <td className="px-4 py-3">{item.quantity} {item.unit || "tons"}</td>
                        <td className="px-4 py-3">₹{(item.rate || 0).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{(item.total || 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                    <tr className="bg-wireframe-bg-alt/20">
                      <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total Order Value</td>
                      <td className="px-4 py-3 text-right font-bold text-primary text-base">
                        ₹{(order.totalOrderValue || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Remarks */}
              {order.remarks && (
                <div className="bg-surface border border-wireframe-border p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Remarks / Approval Notes</h4>
                  <p className="text-sm font-medium text-foreground italic">"{order.remarks}"</p>
                </div>
              )}

              {/* Order Dates Details */}
              <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-5 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Required Delivery Date</span>
                  <p className="font-semibold mt-1">
                    {order.requiredDeliveryDate ? new Date(order.requiredDeliveryDate).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Dispatch Plant</span>
                  <p className="font-semibold mt-1">
                    {order.plantName || "-"} {order.dispatchLocation ? `(${order.dispatchLocation})` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-1 space-y-6">
              {/* Customer Details */}
              <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-5 space-y-4">
                <h3 className="font-semibold text-lg border-b border-wireframe-border pb-2">Customer & Firm</h3>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-bold text-primary">{order.customerId?.companyName || "-"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Code: {order.customerId?.customerCode || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Execution Firm</p>
                  <p className="font-medium">{order.executionFirmId?.firmName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sales Executive</p>
                  <p className="font-medium">
                    {order.salesExecutiveId 
                      ? `${order.salesExecutiveId.firstName} ${order.salesExecutiveId.lastName}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Location</p>
                  <p className="font-medium text-xs whitespace-pre-line">{order.deliveryAddress || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOGISTICS */}
        {activeTab === "logistics" && (
          <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg">Transport & Logistics Desk</h3>
              {!isEditingLogistics && (
                <button
                  onClick={startLogisticsEdit}
                  className="px-4 py-1.5 bg-primary text-on-primary text-sm font-medium rounded hover:opacity-90 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit Logistics Details
                </button>
              )}
            </div>

            {isEditingLogistics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Transporter Name</label>
                      <input
                        type="text"
                        className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={transporterName}
                        onChange={(e) => setTransporterName(e.target.value)}
                        placeholder="e.g. Punjab Road Carrier"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Vehicle Number</label>
                      <input
                        type="text"
                        className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="e.g. PB-13-AB-9876"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Driver Name</label>
                      <input
                        type="text"
                        className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="e.g. Gurnam Singh"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Driver Mobile</label>
                      <input
                        type="text"
                        className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={driverMobile}
                        onChange={(e) => setDriverMobile(e.target.value)}
                        placeholder="e.g. 9417012345"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">LR Number (Lorry Receipt)</label>
                      <input
                        type="text"
                        className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={lrNumber}
                        onChange={(e) => setLrNumber(e.target.value)}
                        placeholder="e.g. PRC-998877"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Dispatch Date</label>
                      <input
                        type="date"
                        className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={dispatchDate}
                        onChange={(e) => setDispatchDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Expected Delivery Date</label>
                      <input
                        type="date"
                        className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={expectedDeliveryDate}
                        onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Freight Cost (₹)</label>
                        <input
                          type="number"
                          className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={freightCost}
                          onChange={(e) => setFreightCost(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Loading Charges (₹)</label>
                        <input
                          type="number"
                          className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={loadingCharges}
                          onChange={(e) => setLoadingCharges(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-wireframe-border pt-4">
                  <button
                    onClick={() => setIsEditingLogistics(false)}
                    className="px-4 py-2 border border-wireframe-border rounded-md font-medium hover:bg-wireframe-bg-alt transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => logisticsMutation.mutate()}
                    disabled={logisticsMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-75"
                  >
                    {logisticsMutation.isPending ? "Saving..." : "Save & Make Dispatch Ready"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 pb-2 border-b border-wireframe-border/50">
                    <span className="text-muted-foreground">Transporter</span>
                    <span className="font-semibold text-right">{order.logistics?.transporterName || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 pb-2 border-b border-wireframe-border/50">
                    <span className="text-muted-foreground">Vehicle Number</span>
                    <span className="font-semibold text-right">{order.logistics?.vehicleNumber || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 pb-2 border-b border-wireframe-border/50">
                    <span className="text-muted-foreground">Driver Details</span>
                    <span className="font-semibold text-right">
                      {order.logistics?.driverName || "-"} 
                      {order.logistics?.driverMobile ? ` (${order.logistics.driverMobile})` : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 pb-2 border-b border-wireframe-border/50">
                    <span className="text-muted-foreground">LR Number</span>
                    <span className="font-semibold text-right">{order.logistics?.lrNumber || "-"}</span>
                  </div>
                </div>
                <div className="space-y-4 bg-wireframe-bg-alt/30 p-4 rounded-lg border border-wireframe-border">
                  <h4 className="font-medium mb-2 text-primary">Freight & Costs</h4>
                  <div className="grid grid-cols-2 pb-2 border-b border-wireframe-border/50">
                    <span className="text-muted-foreground">Freight Cost</span>
                    <span className="font-medium text-right">₹{(order.logistics?.freightCost || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="grid grid-cols-2 pb-2 border-b border-wireframe-border/50">
                    <span className="text-muted-foreground">Loading Charges</span>
                    <span className="font-medium text-right">₹{(order.logistics?.loadingCharges || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="grid grid-cols-2 pt-2">
                    <span className="font-bold">Total Logistics Cost</span>
                    <span className="font-bold text-right text-primary">
                      ₹{((order.logistics?.freightCost || 0) + (order.logistics?.loadingCharges || 0)).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DISPATCH COPY */}
        {activeTab === "dispatch" && (
          <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-lg">Dispatch Copy Details</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                order.status === "DELIVERED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}>
                {order.status === "DELIVERED" ? "Completed / Delivered" : "Transit Status: " + order.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-wireframe-bg-alt/30 rounded border border-wireframe-border">
                <p className="text-sm text-muted-foreground mb-1">Dispatch Date</p>
                <p className="font-bold">
                  {order.logistics?.dispatchDate ? new Date(order.logistics.dispatchDate).toLocaleDateString() : "-"}
                </p>
              </div>
              <div className="p-4 bg-wireframe-bg-alt/30 rounded border border-wireframe-border">
                <p className="text-sm text-muted-foreground mb-1">Expected Delivery</p>
                <p className="font-bold">
                  {order.logistics?.expectedDeliveryDate ? new Date(order.logistics.expectedDeliveryDate).toLocaleDateString() : "-"}
                </p>
              </div>
              <div className="p-4 bg-wireframe-bg-alt/30 rounded border border-wireframe-border">
                <p className="text-sm text-muted-foreground mb-1">Lorry Receipt Reference</p>
                <p className="font-bold">{order.logistics?.lrNumber || "N/A"}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INVOICE & PAYMENTS */}
        {activeTab === "invoice" && (
          <div className="space-y-6">
            {orderInvoices.length === 0 ? (
              <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-8 text-center">
                <h4 className="font-semibold text-lg mb-2">No Invoices Generated</h4>
                <p className="text-muted-foreground mb-4">An invoice must be generated to record payments for this order.</p>
                {(user?.role === "Admin" || user?.role === "Accounts") && (
                  <button
                    onClick={() => generateInvoiceMutation.mutate()}
                    disabled={generateInvoiceMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-md font-medium flex items-center gap-2 mx-auto disabled:opacity-75"
                  >
                    {generateInvoiceMutation.isPending ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                        Generating...
                      </>
                    ) : "Generate Invoice Now"}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
                <div className="md:col-span-2 space-y-6">
                  {/* Payments Table */}
                  <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium flex justify-between items-center">
                      <span>Payments History</span>
                      {(user?.role === "Admin" || user?.role === "Accounts") && (
                        <button
                          onClick={() => {
                            setPaymentInvoiceId(orderInvoices[0]._id);
                            setIsRecordingPayment(true);
                          }}
                          className="text-sm text-primary font-bold hover:underline"
                        >
                          Record Payment
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      {orderPayments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-6">No payments recorded yet.</p>
                      ) : (
                        <table className="w-full text-sm text-left">
                          <thead className="bg-wireframe-bg-alt/30 border-b border-wireframe-border">
                            <tr>
                              <th className="px-4 py-2 font-medium">Date</th>
                              <th className="px-4 py-2 font-medium">Mode</th>
                              <th className="px-4 py-2 font-medium">Reference</th>
                              <th className="px-4 py-2 font-medium text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderPayments.map((pay: any, idx: number) => (
                              <tr key={pay._id || idx} className="border-b border-wireframe-border">
                                <td className="px-4 py-3">{new Date(pay.paymentDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3">{pay.paymentMode}</td>
                                <td className="px-4 py-3">{pay.referenceNumber || "-"}</td>
                                <td className="px-4 py-3 text-right font-medium text-green-600">
                                  ₹{(pay.amountReceived || 0).toLocaleString("en-IN")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Payment Record Pop-in Form */}
                  {isRecordingPayment && (
                    <div className="bg-surface border border-primary/30 rounded-lg shadow p-5 space-y-4">
                      <h4 className="font-semibold text-primary border-b border-wireframe-border pb-2">Record New Payment Receipt</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Amount Received (₹) *</label>
                          <input
                            type="number"
                            className="w-full border border-input bg-background rounded px-3 py-1.5 text-sm"
                            value={paymentAmount || ""}
                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Payment Date *</label>
                          <input
                            type="date"
                            className="w-full border border-input bg-background rounded px-3 py-1.5 text-sm"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Payment Mode</label>
                          <select
                            className="w-full border border-input bg-background rounded px-3 py-1.5 text-sm"
                            value={paymentMode}
                            onChange={(e) => setPaymentMode(e.target.value)}
                          >
                            <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                            <option value="UPI">UPI</option>
                            <option value="CASH">Cash</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="CREDIT_CARD">Credit Card</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Reference Number (Txn ID/Cheque No.)</label>
                          <input
                            type="text"
                            className="w-full border border-input bg-background rounded px-3 py-1.5 text-sm"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            placeholder="e.g. TXN12345"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Remarks</label>
                        <input
                          type="text"
                          className="w-full border border-input bg-background rounded px-3 py-1.5 text-sm"
                          value={paymentRemarks}
                          onChange={(e) => setPaymentRemarks(e.target.value)}
                          placeholder="e.g. Received part payment"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => setIsRecordingPayment(false)}
                          className="px-3 py-1.5 border border-wireframe-border rounded text-sm font-medium hover:bg-wireframe-bg-alt"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => paymentMutation.mutate()}
                          disabled={paymentMutation.isPending || paymentAmount <= 0}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1.5 rounded text-sm font-medium disabled:opacity-75"
                        >
                          {paymentMutation.isPending ? "Recording..." : "Save Payment"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-1 space-y-6">
                  {/* Financial Summary */}
                  <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-5 space-y-4">
                    <h3 className="font-semibold text-lg border-b border-wireframe-border pb-2">Financial Summary</h3>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Value</span>
                      <span className="font-semibold">₹{(order.totalOrderValue || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoiced Amount</span>
                      <span className="font-semibold">₹{outstandingSummary.invoiced.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Payments Received</span>
                      <span className="font-semibold">- ₹{outstandingSummary.received.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-t border-wireframe-border pt-2 mt-2">
                      <span className="font-bold">Outstanding Balance</span>
                      <span className={`font-bold ${outstandingSummary.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{outstandingSummary.outstanding.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Transition Remarks Modal Dialog */}
      {isShowingStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-wireframe-border shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <h3 className="font-semibold text-lg mb-2">Confirm Status Transition</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You are changing the order status to <span className="font-bold text-primary">{targetStatus}</span>.
              Please add any remarks or approval notes.
            </p>
            <div className="space-y-1.5 mb-6">
              <label className="text-sm font-medium">Remarks / Reason *</label>
              <textarea
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                placeholder="e.g., MD approved rate override exceptions"
              ></textarea>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsShowingStatusModal(false)}
                className="px-4 py-2 border border-wireframe-border rounded-md text-sm font-medium hover:bg-wireframe-bg-alt"
              >
                Cancel
              </button>
              <button
                onClick={submitStatusChange}
                disabled={statusMutation.isPending || !statusRemarks.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-70"
              >
                {statusMutation.isPending ? "Submitting..." : "Confirm & Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Outstanding memo helper
function useMemoOutstanding(invoicesList: any[]) {
  return invoicesList.reduce(
    (acc, curr) => {
      const invoiced = curr.invoiceAmount || 0;
      const received = curr.receivedAmount || 0;
      acc.invoiced += invoiced;
      acc.received += received;
      acc.outstanding += (invoiced - received);
      return acc;
    },
    { invoiced: 0, received: 0, outstanding: 0 }
  );
}
