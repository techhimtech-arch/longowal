import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
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
  const normalizedRole = (user?.role || "").toLowerCase().replace(/[\s_-]/g, "");
  const isSuperAdminOrAdmin = normalizedRole === "superadmin" || normalizedRole === "admin";
  const isMD = normalizedRole === "md" || normalizedRole === "cmd" || normalizedRole === "managingdirector";
  const canEditOrder = isSuperAdminOrAdmin || isMD;
  const isOperations = normalizedRole === "operations" || normalizedRole === "volunteer";
  const isAccounts = normalizedRole === "accounts" || normalizedRole === "citizen" || normalizedRole === "accountant";
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

  // Add Dispatch form state
  const [isAddingDispatch, setIsAddingDispatch] = useState(false);
  const [newDispatchVehicleNumber, setNewDispatchVehicleNumber] = useState("");
  const [newDispatchTransporterName, setNewDispatchTransporterName] = useState("");
  const [newDispatchDriverName, setNewDispatchDriverName] = useState("");
  const [newDispatchDriverMobile, setNewDispatchDriverMobile] = useState("");
  const [newDispatchLrNumber, setNewDispatchLrNumber] = useState("");
  const [newDispatchFreightCost, setNewDispatchFreightCost] = useState(0);
  const [newDispatchLoadingCharges, setNewDispatchLoadingCharges] = useState(0);
  const [newDispatchRemarks, setNewDispatchRemarks] = useState("");
  const [newDispatchProducts, setNewDispatchProducts] = useState<any[]>([]);

  // Rejection Material Adjustment State
  const [adjustmentType, setAdjustmentType] = useState("RETURNED_TO_STOCK");
  const [adjustedToOrderId, setAdjustedToOrderId] = useState("");
  const [adjustmentRemarks, setAdjustmentRemarks] = useState("");

  // Transporter Payments State
  const [isRecordingTransporterPayment, setIsRecordingTransporterPayment] = useState(false);
  const [selectedDispatchId, setSelectedDispatchId] = useState("");
  const [paymentRemarksText, setPaymentRemarksText] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      if (res.data?.url) {
        setPaymentProofUrl(res.data.url);
        toast.success("Payment proof uploaded successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch single order details
  const { data: orderResponse, isLoading: isLoadingOrder, error: orderError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}`);
      return res.data;
    },
  });

  const order = orderResponse?.data;

  const [isEditingOrder, setIsEditingOrder] = useState(false);

  // Fetch Firms list
  const { data: firms = [] } = useQuery({
    queryKey: ["firms"],
    queryFn: async () => {
      const res = await api.get("/firms");
      return res.data?.data || [];
    }
  });

  // Fetch Customers list
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await api.get("/customers");
      return res.data?.data || [];
    }
  });

  // Fetch Master Plants
  const { data: masterPlants = [] } = useQuery({
    queryKey: ["masterPlants"],
    queryFn: async () => {
      try {
        const res = await api.get("/masters?category=PLANT&isActive=all");
        return res.data?.data || [];
      } catch (e) {
        return [];
      }
    }
  });

  // Fetch Master Products
  const { data: masterProducts = [] } = useQuery({
    queryKey: ["masterProducts"],
    queryFn: async () => {
      try {
        const res = await api.get("/masters?category=PRODUCT&isActive=all");
        return res.data?.data || [];
      } catch (e) {
        return [];
      }
    }
  });

  // Edit Order Modal States
  const [editCustomer, setEditCustomer] = useState("");
  const [editFirm, setEditFirm] = useState("");
  const [editExpectedPaymentDate, setEditExpectedPaymentDate] = useState("");
  const [editDeliveryAddress, setEditDeliveryAddress] = useState("");
  const [editDispatchLocation, setEditDispatchLocation] = useState("");
  const [editPlantName, setEditPlantName] = useState("");
  const [editRequiredDeliveryDate, setEditRequiredDeliveryDate] = useState("");
  const [editEstimatedFreight, setEditEstimatedFreight] = useState(0);
  const [editAdvanceAmount, setEditAdvanceAmount] = useState(0);
  const [editRemarks, setEditRemarks] = useState("");
  const [editProducts, setEditProducts] = useState<any[]>([]);

  // Calculate if payment is overdue
  const isPaymentOverdue = order?.expectedPaymentDate && 
    new Date(order.expectedPaymentDate).getTime() < Date.now() && 
    order.paymentStatus !== "PAID" &&
    order.status !== "PAID";

  const totalMarginEarned = useMemo(() => {
    if (!order || !order.products) return 0;
    return order.products.reduce((acc: number, curr: any) => acc + ((curr.quantity || 0) * (curr.margin || 0)), 0);
  }, [order]);

  useEffect(() => {
    if (order) {
      setEditCustomer(order.customerId?._id || order.customerId || "");
      setEditFirm(order.executionFirmId?._id || order.executionFirmId || "");
      setEditExpectedPaymentDate(order.expectedPaymentDate ? new Date(order.expectedPaymentDate).toISOString().split("T")[0] : "");
      setEditDeliveryAddress(order.deliveryAddress || "");
      setEditDispatchLocation(order.dispatchLocation || "");
      setEditPlantName(order.plantName || "");
      setEditRequiredDeliveryDate(order.requiredDeliveryDate ? new Date(order.requiredDeliveryDate).toISOString().split("T")[0] : "");
      setEditEstimatedFreight(order.estimatedFreight || 0);
      setEditAdvanceAmount(order.advanceAmount || 0);
      setEditRemarks(order.remarks || "");
      
      const mappedProducts = (order.products || []).map((p: any, idx: number) => ({
        id: p._id || idx,
        productName: p.productName,
        quantity: p.quantity,
        unit: p.unit,
        supplyRate: p.supplyRate || 0,
        freight: p.freight || 0,
        margin: p.margin || 0,
        gstPercent: p.gstPercent || 0,
        gstAmount: p.gstAmount || 0,
        rate: p.rate || 0,
        total: p.total || 0
      }));
      setEditProducts(mappedProducts.length > 0 ? mappedProducts : [{ id: 1, productName: "", quantity: 0, unit: "tons", supplyRate: 0, freight: 0, margin: 0, gstPercent: 0, gstAmount: 0, rate: 0, total: 0 }]);
    }
  }, [order, isEditingOrder]);

  const handleEditProductChange = (index: number, field: string, value: any) => {
    const newP = [...editProducts];
    const row = { ...newP[index] };
    
    if (field === "productName" || field === "unit") {
      row[field] = value;
    } else {
      row[field] = Number(value);
    }

    const quantity = Number(row.quantity || 0);
    const supplyRate = Number(row.supplyRate || 0);
    const freight = Number(row.freight || 0);
    const gstPercent = Number(row.gstPercent || 0);

    if (field === "rate") {
      const rate = Number(value || 0);
      const total = quantity * rate;
      const supplyValue = quantity * supplyRate;
      const baseCostGst = supplyValue + freight;
      const gstAmount = baseCostGst * (gstPercent / 100);
      const margin = total - baseCostGst - gstAmount;
      
      row.gstAmount = Number(gstAmount.toFixed(2));
      row.margin = Number(margin.toFixed(2));
      row.total = Number(total.toFixed(2));
      row.rate = rate;
    } else {
      const margin = Number(row.margin || 0);
      const supplyValue = quantity * supplyRate;
      const baseCostGst = supplyValue + freight;
      const gstAmount = baseCostGst * (gstPercent / 100);
      const total = baseCostGst + gstAmount + margin;
      
      row.gstAmount = Number(gstAmount.toFixed(2));
      row.total = Number(total.toFixed(2));
      row.rate = quantity > 0 ? Number((total / quantity).toFixed(2)) : 0;
    }
    
    newP[index] = row;
    setEditProducts(newP);
  };

  const updateOrderMutation = useMutation({
    mutationFn: async () => {
      const mappedProducts = editProducts
        .filter(p => p.productName && p.quantity > 0)
        .map(p => ({
          productName: p.productName,
          quantity: p.quantity,
          unit: p.unit,
          supplyRate: p.supplyRate,
          freight: p.freight,
          margin: p.margin,
          gstPercent: p.gstPercent,
          gstAmount: p.gstAmount,
          rate: p.rate,
          total: p.total
        }));

      if (mappedProducts.length === 0) {
        throw new Error("Please add at least one valid product");
      }

      const totalVal = mappedProducts.reduce((acc, p) => acc + p.total, 0);

      const payload = {
        customerId: editCustomer,
        executionFirmId: editFirm || null,
        expectedPaymentDate: editExpectedPaymentDate ? new Date(editExpectedPaymentDate).toISOString() : null,
        deliveryAddress: editDeliveryAddress,
        dispatchLocation: editDispatchLocation,
        plantName: editPlantName,
        requiredDeliveryDate: editRequiredDeliveryDate ? new Date(editRequiredDeliveryDate).toISOString() : null,
        estimatedFreight: editEstimatedFreight,
        advanceAmount: editAdvanceAmount,
        totalOrderValue: totalVal,
        balanceAmount: totalVal - editAdvanceAmount,
        remarks: editRemarks,
        products: mappedProducts
      };

      const res = await api.put(`/orders/${orderId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Order updated successfully!");
      setIsEditingOrder(false);
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update order");
    }
  });

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
  const advancePaymentItem = order?.advanceAmount > 0 ? {
    _id: "advance-payment-id",
    paymentDate: order.createdAt || order.orderDate,
    amountReceived: order.advanceAmount,
    paymentMode: "Advance Received",
    referenceNumber: "ORD-ADVANCE",
    remarks: "Advance amount received at order booking",
    isAdvance: true
  } : null;

  const orderPayments = [
    ...(advancePaymentItem ? [advancePaymentItem] : []),
    ...payments.filter((pay: any) => {
      const payInvId = pay.invoiceId?._id || pay.invoiceId;
      return invoiceIds.includes(payInvId);
    })
  ];

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
    mutationFn: async ({ status }: { status: string }) => {
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
        status,
      };
      const res = await api.put(`/orders/${orderId}/logistics`, payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "FREIGHT_APPROVAL_PENDING"
          ? "Freight approval request successfully sent to MD!"
          : "Logistics transport details updated successfully!"
      );
      setIsEditingLogistics(false);
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update logistics details");
      console.error(err);
    }
  });

  // Fetch Dispatches for this order
  const { data: dispatchesResponse, isLoading: isLoadingDispatches } = useQuery({
    queryKey: ["dispatches", orderId],
    queryFn: async () => {
      const res = await api.get(`/dispatches?orderId=${orderId}`);
      return res.data;
    },
    enabled: !!orderId,
  });
  const dispatchesList = dispatchesResponse?.data || [];

  // Sum dispatches helper variables
  const totalActualFreight = useMemo(() => {
    return dispatchesList.reduce((sum: number, d: any) => sum + (d.freightCost || 0), 0);
  }, [dispatchesList]);

  const totalActualLoading = useMemo(() => {
    return dispatchesList.reduce((sum: number, d: any) => sum + (d.loadingCharges || 0), 0);
  }, [dispatchesList]);

  const logisticsFreightVal = dispatchesList.length > 0 ? totalActualFreight : (order?.estimatedFreight || 0);
  const logisticsLoadingVal = totalActualLoading;

  const getDispatchedQtyForProduct = (productName: string) => {
    return dispatchesList.reduce((sum: number, d: any) => {
      if (d.status === "REJECTED_FREIGHT") return sum;
      const p = d.products?.find((prod: any) => prod.productName === productName);
      return sum + (p?.quantity || 0);
    }, 0);
  };

  // Set initial loaded products in add dispatch dialog
  useEffect(() => {
    if (isAddingDispatch && order?.products) {
      const initialProducts = order.products.map((p: any) => {
        const alreadyDispatched = getDispatchedQtyForProduct(p.productName);
        const remaining = p.quantity - alreadyDispatched;
        return {
          productName: p.productName,
          quantity: remaining > 0 ? remaining : 0,
          totalOrdered: p.quantity,
          alreadyDispatched
        };
      });
      setNewDispatchProducts(initialProducts);
    }
  }, [isAddingDispatch, order, dispatchesResponse]);

  // Mutation for creating a dispatch
  const createDispatchMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/dispatches", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Dispatch created successfully!");
      setIsAddingDispatch(false);
      setNewDispatchVehicleNumber("");
      setNewDispatchTransporterName("");
      setNewDispatchDriverName("");
      setNewDispatchDriverMobile("");
      setNewDispatchLrNumber("");
      setNewDispatchFreightCost(0);
      setNewDispatchLoadingCharges(0);
      setNewDispatchRemarks("");
      
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["dispatches", orderId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create dispatch");
    }
  });

  // Mutation for updating dispatch status
  const updateDispatchStatusMutation = useMutation({
    mutationFn: async ({ dispatchId, status, remarks }: { dispatchId: string; status: string; remarks?: string }) => {
      const res = await api.put(`/dispatches/${dispatchId}/status`, { status, remarks });
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Dispatch status updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["dispatches", orderId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update dispatch status");
    }
  });

  // Mutation for recording transporter payment
  const recordTransporterPaymentMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        transporterPaymentRemarks: paymentRemarksText,
        transporterPaymentProofUrl: paymentProofUrl
      };
      const res = await api.put(`/dispatches/${selectedDispatchId}/payment`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Transporter payment recorded successfully!");
      setIsRecordingTransporterPayment(false);
      setPaymentRemarksText("");
      setPaymentProofUrl("");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["dispatches", orderId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to record payment");
    }
  });

  // Mutation for updating order status
  const statusMutation = useMutation({
    mutationFn: async (payload: { status: string; remarks?: string; materialAdjustment?: any }) => {
      const res = await api.put(`/orders/${orderId}/status`, payload);
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
    }
  });

  const triggerStatusChange = (status: string) => {
    setTargetStatus(status);
    setIsShowingStatusModal(true);
  };

  const submitStatusChange = () => {
    const payload: any = { status: targetStatus, remarks: statusRemarks };
    if (targetStatus === "REJECTED") {
      payload.materialAdjustment = {
        adjustmentType,
        adjustedToOrderId: adjustmentType === "DIVERTED_TO_OTHER_ORDER" ? adjustedToOrderId : undefined,
        adjustmentRemarks
      };
    }
    statusMutation.mutate(payload);
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
    { id: "history", label: "Order History" },
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
          {canEditOrder && (
            <button
              onClick={() => setIsEditingOrder(true)}
              className="bg-white border border-wireframe-border hover:bg-wireframe-bg-alt text-on-surface px-4 py-2 rounded-md font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit Order
            </button>
          )}

          {order.status === "DRAFT" && (
            <button
              onClick={() => statusMutation.mutate({ status: "PENDING_MD_APPROVAL", remarks: "Submitting draft for approval" })}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
            >
              Submit for Approval
            </button>
          )}

          {order.status === "PENDING_MD_APPROVAL" && (isSuperAdminOrAdmin || isOperations) && (
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

          {order.status === "FREIGHT_APPROVAL_PENDING" && (isSuperAdminOrAdmin || isMD) && (
            <>
              <button
                onClick={() => triggerStatusChange("APPROVED_FREIGHT")}
                className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md font-medium"
              >
                Approve Freight
              </button>
              <button
                onClick={() => triggerStatusChange("REJECTED_FREIGHT")}
                className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md font-medium"
              >
                Reject Freight
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

      {order.status === "REJECTED" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-red-600 mt-0.5">warning</span>
            <div>
              <h4 className="font-bold text-sm">Order Booking Rejected</h4>
              <p className="text-xs text-red-700 mt-1">
                Remarks: {order.remarks || "No reason specified."}
              </p>
              {order.materialAdjustment && (
                <div className="mt-2 text-xs bg-white/60 p-2.5 rounded border border-red-100 space-y-1">
                  <span className="font-bold text-[10px] uppercase text-red-600 block mb-1">Material Adjustment Plan</span>
                  <div>
                    <span className="font-semibold">Type: </span>
                    {order.materialAdjustment.adjustmentType === "DIVERTED_TO_OTHER_ORDER" ? "Diverted to other Order" :
                     order.materialAdjustment.adjustmentType === "RETURNED_TO_STOCK" ? "Returned to Stock" : "Other"}
                  </div>
                  {order.materialAdjustment.adjustedToOrderId && (
                    <div>
                      <span className="font-semibold">Diverted to Order ID: </span>
                      <span className="font-mono bg-red-100/50 px-1 rounded">{order.materialAdjustment.adjustedToOrderId}</span>
                    </div>
                  )}
                  {order.materialAdjustment.adjustmentRemarks && (
                    <div>
                      <span className="font-semibold">Adjustment Notes: </span>
                      {order.materialAdjustment.adjustmentRemarks}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[850px]">
                    <thead className="bg-wireframe-bg-alt/30 border-b border-wireframe-border text-muted-foreground text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 font-medium">Qty</th>
                        <th className="px-4 py-3 font-medium">Supply Rate</th>
                        <th className="px-4 py-3 font-medium">Freight</th>
                        <th className="px-4 py-3 font-medium">Margin</th>
                        <th className="px-4 py-3 font-medium">GST %</th>
                        <th className="px-4 py-3 font-medium">GST Amt</th>
                        <th className="px-4 py-3 font-medium">Selling Rate</th>
                        <th className="px-4 py-3 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.products?.map((item: any, idx: number) => (
                        <tr key={item._id || idx} className="border-b border-wireframe-border">
                          <td className="px-4 py-3 font-medium">
                            {(() => {
                              const match = masterProducts.find((mp: any) => mp.key === item.productName);
                              return match ? `${item.productName} - ${match.value?.name || item.productName}` : item.productName;
                            })()}
                          </td>
                          <td className="px-4 py-3">{item.quantity} {item.unit || "tons"}</td>
                          <td className="px-4 py-3">₹{(item.supplyRate || 0).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3">₹{(item.freight || 0).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 font-semibold text-green-700">₹{(item.margin || 0).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3">{item.gstPercent || 0}%</td>
                          <td className="px-4 py-3">₹{(item.gstAmount || 0).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 font-medium">₹{(item.rate || 0).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 text-right font-medium">₹{(item.total || 0).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                      <tr className="bg-wireframe-bg-alt/20 border-t border-wireframe-border">
                        <td colSpan={8} className="px-4 py-3 text-right font-semibold">Total Order Value</td>
                        <td className="px-4 py-3 text-right font-bold text-primary text-base">
                          ₹{(order.totalOrderValue || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remarks */}
              {order.remarks && (
                <div className="bg-surface border border-wireframe-border p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Remarks / Approval Notes</h4>
                  <p className="text-sm font-medium text-foreground italic">"{order.remarks}"</p>
                </div>
              )}

              {/* Order Dates Details */}
              <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-5 grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Required Delivery Date</span>
                  <p className="font-semibold mt-1">
                    {order.requiredDeliveryDate ? new Date(order.requiredDeliveryDate).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Expected Payment Date</span>
                  <p className={`font-semibold mt-1 ${isPaymentOverdue ? 'text-red-600 font-bold flex items-center gap-1.5' : ''}`}>
                    {order.expectedPaymentDate ? new Date(order.expectedPaymentDate).toLocaleDateString() : "-"}
                    {isPaymentOverdue && (
                      <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase inline-block">Overdue</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Dispatch Plant</span>
                  <p className="font-semibold mt-1">
                    {(() => {
                      if (!order.plantName) return "-";
                      const matchedPlant = masterPlants.find((p: any) => p.key === order.plantName);
                      return matchedPlant ? `${order.plantName} - ${matchedPlant.value?.name || order.plantName}` : order.plantName;
                    })()} {order.dispatchLocation ? `(${order.dispatchLocation})` : ""}
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

              {/* Order Balance Sheet / Ledger */}
              <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-5 space-y-4">
                <h3 className="font-semibold text-lg border-b border-wireframe-border pb-2 flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-[20px]">account_balance</span>
                  Order Balance Sheet
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Value:</span>
                    <span className="font-semibold text-foreground">₹{(order.totalOrderValue || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-green-700 bg-green-50 p-1.5 rounded border border-green-100/50">
                    <span className="font-semibold">Est. Margin Earned:</span>
                    <span className="font-bold">₹{totalMarginEarned.toLocaleString("en-IN")}</span>
                  </div>
                  
                  {/* Transport / Freight cost details */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      Freight charges:
                      {dispatchesList.length > 0 ? (
                        <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded font-bold uppercase">Actual</span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-800 px-1 rounded font-bold uppercase">Est.</span>
                      )}
                    </span>
                    <span className="font-semibold text-foreground">
                      ₹{logisticsFreightVal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Loading Charges if present */}
                  {logisticsLoadingVal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loading Charges:</span>
                      <span className="font-semibold text-foreground">₹{logisticsLoadingVal.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {/* Other Charges if present */}
                  {(order.logistics?.otherCharges || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Other Charges:</span>
                      <span className="font-semibold text-foreground">₹{order.logistics.otherCharges.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <hr className="border-wireframe-border" />

                  {/* Total Billing Value */}
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Total Billing Value:</span>
                    <span>
                      ₹{(
                        (order.totalOrderValue || 0) +
                        logisticsFreightVal +
                        logisticsLoadingVal +
                        (order.logistics?.otherCharges || 0)
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <hr className="border-wireframe-border" />

                  {/* Payments Breakdown */}
                  <div className="space-y-1 bg-wireframe-bg-alt/20 p-2.5 rounded border border-wireframe-border/50 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Advance Received:</span>
                      <span className="font-medium text-foreground">₹{(order.advanceAmount || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>Invoiced Payments:</span>
                      <span className="font-medium">- ₹{outstandingSummary.received.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold text-green-700">
                    <span>Total Received:</span>
                    <span>
                      ₹{(
                        (order.advanceAmount || 0) + 
                        outstandingSummary.received
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <hr className="border-wireframe-border" />

                  {/* Net Outstanding Balance */}
                  <div className="flex justify-between font-bold items-center py-1">
                    <span className="text-foreground">Net Outstanding Balance:</span>
                    <span className={`text-base p-1 px-2.5 rounded ${
                      (
                        ((order.totalOrderValue || 0) +
                        logisticsFreightVal +
                        logisticsLoadingVal +
                        (order.logistics?.otherCharges || 0)) -
                        ((order.advanceAmount || 0) + outstandingSummary.received)
                      ) > 0 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      ₹{(
                        ((order.totalOrderValue || 0) +
                        logisticsFreightVal +
                        logisticsLoadingVal +
                        (order.logistics?.otherCharges || 0)) -
                        ((order.advanceAmount || 0) + outstandingSummary.received)
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOGISTICS */}
        {activeTab === "logistics" && (
          <div className="space-y-6">
            {/* Order Dispatch Progress Summary */}
            <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4 text-foreground">Order Dispatch Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(order?.products || []).map((p: any) => {
                  const dispQty = getDispatchedQtyForProduct(p.productName);
                  const remaining = Math.max(0, p.quantity - dispQty);
                  const progressPct = Math.min(100, Math.round((dispQty / p.quantity) * 100));
                  return (
                    <div key={p._id || p.productName} className="p-4 bg-wireframe-bg-alt/30 border border-wireframe-border rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm">{p.productName}</span>
                        <span className="text-xs text-muted-foreground">{p.unit}</span>
                      </div>
                      <div className="text-2xl font-bold text-primary mb-2">
                        {dispQty} / {p.quantity} <span className="text-sm font-medium text-muted-foreground">dispatched</span>
                      </div>
                      <div className="w-full bg-wireframe-border h-2 rounded-full overflow-hidden mb-1">
                        <div className="bg-green-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{progressPct}% Completed</span>
                        <span className={remaining > 0 ? "text-yellow-600 font-medium" : "text-green-600 font-medium"}>
                          {remaining > 0 ? `${remaining} remaining` : "Fully dispatched"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dispatches list */}
            <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Vehicle Trips / Dispatches</h3>
                  <p className="text-sm text-muted-foreground">Track separate vehicle trips and their respective freights</p>
                </div>
                {order?.status !== "DELIVERED" && (
                  <button
                    onClick={() => setIsAddingDispatch(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Vehicle Dispatch
                  </button>
                )}
              </div>

              {isLoadingDispatches ? (
                <div className="py-8 text-center text-muted-foreground">
                  <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full inline-block mr-2 align-middle"></span>
                  Loading dispatches...
                </div>
              ) : dispatchesList.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground border-2 border-dashed border-wireframe-border rounded-lg">
                  No vehicle dispatches recorded for this order yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-wireframe-border text-xs text-muted-foreground uppercase font-bold bg-wireframe-bg-alt/30">
                        <th className="py-3 px-4">Dispatch #</th>
                        <th className="py-3 px-4">Vehicle Details</th>
                        <th className="py-3 px-4">Transporter</th>
                        <th className="py-3 px-4">Loaded Qty</th>
                        <th className="py-3 px-4">Freight & Status</th>
                        <th className="py-3 px-4">Trip Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-wireframe-border text-sm">
                      {dispatchesList.map((disp: any) => {
                        const totalLoaded = disp.products?.reduce((sum: number, p: any) => sum + p.quantity, 0) || 0;
                        return (
                          <tr key={disp._id} className="hover:bg-wireframe-bg-alt/10">
                            <td className="py-3 px-4 font-medium text-primary">
                              {disp.dispatchNumber}
                              <div className="text-[10px] text-muted-foreground">{new Date(disp.dispatchDate).toLocaleDateString()}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-foreground">{disp.vehicleNumber}</div>
                              <div className="text-xs text-muted-foreground">{disp.driverName} ({disp.driverMobile})</div>
                            </td>
                            <td className="py-3 px-4">
                              <div>{disp.transporterName || "-"}</div>
                              <div className="text-[10px] text-muted-foreground">LR: {disp.lrNumber || "-"}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-foreground">{totalLoaded} tons</div>
                              <div className="text-[10px] text-muted-foreground">
                                {disp.products?.map((p: any) => `${p.productName}: ${p.quantity}`).join(", ")}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-foreground">₹{disp.freightCost?.toLocaleString("en-IN")}</div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {disp.isFreightApproved ? (
                                  <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-bold border border-green-200">Approved</span>
                                ) : disp.status === "FREIGHT_APPROVAL_PENDING" ? (
                                  <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded font-bold border border-yellow-200 animate-pulse">Pending MD</span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-800 text-[10px] px-2 py-0.5 rounded font-bold border border-gray-200">Not Req.</span>
                                )}
                              </div>
                              <div className="mt-1.5 text-[10px] space-y-1">
                                <div className="text-muted-foreground font-semibold">Payment Status:</div>
                                {disp.transporterPaymentStatus === "PAID" ? (
                                  <div className="space-y-0.5">
                                    <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-bold uppercase border border-green-200">Paid</span>
                                    {disp.transporterPaymentProofUrl && (
                                      <a
                                        href={disp.transporterPaymentProofUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block text-primary hover:underline font-semibold"
                                      >
                                        View Proof
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold uppercase border border-red-200">Unpaid</span>
                                    {disp.status === "DELIVERED" && (isSuperAdminOrAdmin || isAccounts) && (
                                      <button
                                        onClick={() => {
                                          setSelectedDispatchId(disp._id);
                                          setIsRecordingTransporterPayment(true);
                                        }}
                                        className="block mt-1 text-[10px] text-primary font-bold hover:underline"
                                      >
                                        Record Payment
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                disp.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                disp.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800' :
                                disp.status === 'IN_TRANSIT' ? 'bg-indigo-100 text-indigo-800' :
                                disp.status === 'FREIGHT_APPROVAL_PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {disp.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-y-1">
                              {/* MD Approval Buttons */}
                              {disp.status === "FREIGHT_APPROVAL_PENDING" && (isSuperAdminOrAdmin || isMD) && (
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => updateDispatchStatusMutation.mutate({ dispatchId: disp._id, status: "APPROVED_FREIGHT" })}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded font-semibold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      const remarks = prompt("Enter rejection reason:");
                                      if (remarks !== null) {
                                        updateDispatchStatusMutation.mutate({ dispatchId: disp._id, status: "REJECTED_FREIGHT", remarks });
                                      }
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded font-semibold"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}

                              {/* Logistics transition buttons */}
                              {disp.status !== "DELIVERED" && disp.status !== "FREIGHT_APPROVAL_PENDING" && (
                                <div className="flex justify-end gap-1.5">
                                  {disp.status === "PLANNED" && (
                                    <button
                                      onClick={() => updateDispatchStatusMutation.mutate({ dispatchId: disp._id, status: "DISPATCHED" })}
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded font-semibold"
                                    >
                                      Dispatch
                                    </button>
                                  )}
                                  {(disp.status === "DISPATCHED" || disp.status === "IN_TRANSIT") && (
                                    <button
                                      onClick={() => updateDispatchStatusMutation.mutate({ dispatchId: disp._id, status: "DELIVERED" })}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded font-semibold"
                                    >
                                      Deliver
                                    </button>
                                  )}
                                </div>
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
                {(isSuperAdminOrAdmin || isAccounts) && (
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
                      {(isSuperAdminOrAdmin || isAccounts) && (
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

        {/* TAB 5: ORDER HISTORY TIMELINE */}
        {activeTab === "history" && (
          <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-6 animate-in fade-in duration-200">
            <h3 className="font-semibold text-lg border-b border-wireframe-border pb-2 mb-6">Order Activity & Status Timeline</h3>
            {!order.statusHistory || order.statusHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <span className="material-symbols-outlined text-[48px] text-muted-foreground/30 mb-2">history</span>
                <p>No activity history logged for this order.</p>
              </div>
            ) : (
              <div className="relative border-l border-wireframe-border ml-4 pl-6 space-y-6">
                {order.statusHistory.map((item: any, idx: number) => {
                  const isDelivered = item.status === 'DELIVERED';
                  const isShipped = item.status === 'SHIPPED';
                  const isApproved = item.status === 'APPROVED';
                  const isDraft = item.status === 'DRAFT';
                  const isRejected = item.status === 'REJECTED';

                  return (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                        isDelivered ? 'bg-green-600' :
                        isRejected ? 'bg-red-600' :
                        isApproved ? 'bg-purple-600' :
                        isShipped ? 'bg-blue-600' :
                        isDraft ? 'bg-gray-400' :
                        'bg-yellow-500'
                      }`}></span>

                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold mr-2 ${
                            isDelivered ? 'bg-green-100 text-green-800' :
                            isRejected ? 'bg-red-100 text-red-800' :
                            isApproved ? 'bg-purple-100 text-purple-800' :
                            isShipped ? 'bg-blue-100 text-blue-800' :
                            isDraft ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            by {item.updatedByName || "User"}
                          </span>
                          <p className="text-sm text-on-surface mt-1 bg-wireframe-bg-alt/30 p-2.5 rounded border border-wireframe-border/50 max-w-2xl">
                            {item.remarks || "No remarks provided"}
                          </p>
                        </div>
                        <div className="text-xs text-outline whitespace-nowrap mt-1 md:mt-0 font-medium">
                          {new Date(item.updatedAt).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Order Modal Dialog */}
      {isEditingOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg border border-wireframe-border shadow-xl max-w-4xl w-full p-6 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-wireframe-border pb-4 mb-4">
              <h3 className="font-bold text-xl text-foreground">Edit Order Details: {order.orderNumber}</h3>
              <button onClick={() => setIsEditingOrder(false)} className="text-muted-foreground hover:text-foreground">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Section 1: Core Order & Firm Details */}
              <div className="border border-wireframe-border rounded p-4 bg-wireframe-bg-alt/10 space-y-4">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">1. Customer, Firm & Payment Date</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Select Customer *</label>
                    <select
                      className="w-full border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={editCustomer}
                      onChange={(e) => setEditCustomer(e.target.value)}
                    >
                      <option value="">Select Customer...</option>
                      {customers.map((c: any) => (
                        <option key={c._id} value={c._id}>{c.companyName} ({c.customerCode || "No Code"})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Execution Firm</label>
                    <select
                      className="w-full border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={editFirm}
                      onChange={(e) => setEditFirm(e.target.value)}
                    >
                      <option value="">Select Firm</option>
                      {firms.map((f: any) => (
                        <option key={f._id} value={f._id}>{f.firmName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-primary">Expected Payment Date (Reminder Deadline) *</label>
                    <input
                      type="date"
                      className="w-full border border-primary/30 bg-background rounded px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      value={editExpectedPaymentDate}
                      onChange={(e) => setEditExpectedPaymentDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Delivery & Dispatch details */}
              <div className="border border-wireframe-border rounded p-4 bg-wireframe-bg-alt/10 space-y-4">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">2. Delivery & Dispatch Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Delivery Address</label>
                    <textarea
                      className="w-full border border-input bg-background rounded px-3 py-2 text-sm min-h-[90px] focus:outline-none focus:ring-2 focus:ring-primary"
                      value={editDeliveryAddress}
                      onChange={(e) => setEditDeliveryAddress(e.target.value)}
                      placeholder="Enter delivery address..."
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Plant Name</label>
                        <select
                          className="w-full border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={editPlantName}
                          onChange={(e) => setEditPlantName(e.target.value)}
                        >
                          <option value="">Select Loading Plant</option>
                          {masterPlants.map((p: any) => (
                            <option key={p._id} value={p.key}>
                              {p.value?.name || p.key}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Dispatch Location</label>
                        <input
                          type="text"
                          className="w-full border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={editDispatchLocation}
                          onChange={(e) => setEditDispatchLocation(e.target.value)}
                          placeholder="e.g. Gate 1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Required Delivery Date</label>
                        <input
                          type="date"
                          className="w-full border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={editRequiredDeliveryDate}
                          onChange={(e) => setEditRequiredDeliveryDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Estimated Freight (₹)</label>
                        <input
                          type="number"
                          className="w-full border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={editEstimatedFreight || ""}
                          onChange={(e) => setEditEstimatedFreight(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Product rows */}
              <div className="border border-wireframe-border rounded p-4 bg-wireframe-bg-alt/10 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-primary uppercase tracking-wider">3. Products Details</h4>
                  <button
                    type="button"
                    onClick={() => setEditProducts([...editProducts, { id: Date.now(), productName: "", quantity: 0, unit: "tons", supplyRate: 0, freight: 0, margin: 0, gstPercent: 0, gstAmount: 0, rate: 0, total: 0 }])}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span> Add Product
                  </button>
                </div>
                <div className="border border-wireframe-border rounded overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[850px]">
                    <thead className="bg-wireframe-bg-alt/50 border-b border-wireframe-border">
                      <tr>
                        <th className="px-3 py-2 font-semibold w-[22%]">Product Name</th>
                        <th className="px-3 py-2 font-semibold">Quantity</th>
                        <th className="px-3 py-2 font-semibold w-20">Unit</th>
                        <th className="px-3 py-2 font-semibold">Supply Rate (₹)</th>
                        <th className="px-3 py-2 font-semibold">Freight (₹)</th>
                        <th className="px-3 py-2 font-semibold">Margin (₹)</th>
                        <th className="px-3 py-2 font-semibold">GST %</th>
                        <th className="px-3 py-2 font-semibold">Selling Rate (₹)</th>
                        <th className="px-3 py-2 font-semibold text-right">Total (₹)</th>
                        <th className="px-3 py-2 font-semibold text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editProducts.map((p, index) => (
                        <tr key={p.id} className="border-b border-wireframe-border last:border-0 bg-white">
                          <td className="px-3 py-2">
                            <select
                              className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                              value={p.productName}
                              onChange={(e) => {
                                const prodName = e.target.value;
                                const match = masterProducts.find((mp: any) => mp.key === prodName);
                                if (match) {
                                  const newP = [...editProducts];
                                  newP[index] = {
                                    ...newP[index],
                                    productName: prodName,
                                    unit: match.value?.defaultUnit || "tons",
                                    gstPercent: match.value?.defaultGstPercent || 0
                                  };
                                  setEditProducts(newP);
                                  handleEditProductChange(index, "productName", prodName);
                                } else {
                                  const newP = [...editProducts];
                                  newP[index].productName = prodName;
                                  setEditProducts(newP);
                                  handleEditProductChange(index, "productName", prodName);
                                }
                              }}
                            >
                              <option value="">Select Product</option>
                              {masterProducts.map((mp: any) => (
                                <option key={mp._id} value={mp.key}>
                                  {mp.value?.name || mp.key}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                              value={p.quantity || ""}
                              onChange={(e) => handleEditProductChange(index, "quantity", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              className="w-full border border-input bg-background rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                              value={p.unit}
                              onChange={(e) => {
                                const newP = [...editProducts];
                                newP[index].unit = e.target.value;
                                setEditProducts(newP);
                              }}
                            >
                              <option value="tons">tons</option>
                              <option value="kg">kg</option>
                              <option value="bags">bags</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none"
                              value={p.supplyRate || ""}
                              onChange={(e) => handleEditProductChange(index, "supplyRate", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none"
                              value={p.freight || ""}
                              onChange={(e) => handleEditProductChange(index, "freight", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none"
                              value={p.margin || ""}
                              onChange={(e) => handleEditProductChange(index, "margin", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none"
                              value={p.gstPercent || ""}
                              onChange={(e) => handleEditProductChange(index, "gstPercent", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none"
                              value={p.rate || ""}
                              onChange={(e) => handleEditProductChange(index, "rate", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 font-medium bg-wireframe-bg-alt/10 text-right">
                            ₹{(p.total || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const newP = [...editProducts];
                                newP.splice(index, 1);
                                setEditProducts(newP.length > 0 ? newP : [{ id: 1, productName: "", quantity: 0, unit: "tons", supplyRate: 0, freight: 0, margin: 0, gstPercent: 0, gstAmount: 0, rate: 0, total: 0 }]);
                              }}
                              disabled={editProducts.length === 1}
                              className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Advance Amount & Calculations */}
              <div className="border border-wireframe-border rounded p-4 bg-wireframe-bg-alt/10 space-y-4">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">4. Financial Totals</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 border border-wireframe-border rounded flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Order Value (Calculated)</span>
                    <span className="text-xl font-bold">₹{editProducts.reduce((acc, p) => acc + (p.quantity * p.rate), 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Advance Payment Received (₹)</label>
                    <input
                      type="number"
                      className="w-full border border-input bg-background rounded px-3 py-2 text-sm font-semibold focus:outline-none"
                      value={editAdvanceAmount || ""}
                      onChange={(e) => setEditAdvanceAmount(Number(e.target.value))}
                    />
                  </div>
                  <div className="bg-red-50 p-3 border border-red-100 rounded flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-bold text-red-600">Balance Outstanding (Calculated)</span>
                    <span className="text-xl font-bold text-red-700">
                      ₹{(editProducts.reduce((acc, p) => acc + (p.quantity * p.rate), 0) - editAdvanceAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">Remarks / Internal Notes</label>
                <textarea
                  className="w-full border border-input bg-background rounded px-3 py-2 text-sm min-h-[60px]"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 border-t border-wireframe-border pt-4 mt-4">
              <button
                type="button"
                onClick={() => setIsEditingOrder(false)}
                className="px-4 py-2 border border-wireframe-border rounded-md text-sm font-medium hover:bg-wireframe-bg-alt"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateOrderMutation.mutate()}
                disabled={updateOrderMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-md text-sm font-semibold flex items-center gap-1.5 disabled:opacity-70 shadow"
              >
                {updateOrderMutation.isPending ? "Saving..." : "Save Order Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Transition Remarks Modal Dialog */}
      {isShowingStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-wireframe-border shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <h3 className="font-semibold text-lg mb-2">Confirm Status Transition</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You are changing the order status to <span className="font-bold text-primary">{targetStatus}</span>.
              Please add any remarks or approval notes.
            </p>
            {targetStatus === "REJECTED" && (
              <div className="space-y-3 mb-4 p-3 bg-red-50/50 border border-red-100 rounded-md">
                <h4 className="font-bold text-xs uppercase text-red-700 tracking-wider">Material Adjustment Plan</h4>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Adjustment Type *</label>
                  <select
                    className="w-full border border-input bg-background rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                  >
                    <option value="RETURNED_TO_STOCK">Returned to Stock</option>
                    <option value="DIVERTED_TO_OTHER_ORDER">Diverted to other Order</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                {adjustmentType === "DIVERTED_TO_OTHER_ORDER" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Divert to Order ID (Reference) *</label>
                    <input
                      type="text"
                      className="w-full border border-input bg-background rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={adjustedToOrderId}
                      onChange={(e) => setAdjustedToOrderId(e.target.value)}
                      placeholder="e.g. 6a420ff3..."
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Adjustment Notes / Instructions</label>
                  <input
                    type="text"
                    className="w-full border border-input bg-background rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={adjustmentRemarks}
                    onChange={(e) => setAdjustmentRemarks(e.target.value)}
                    placeholder="e.g. Diverted loaded truck to customer Y order"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5 mb-6">
              <label className="text-sm font-medium text-foreground">Remarks / Reason *</label>
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
      {/* Add Dispatch Modal Dialog */}
      {isAddingDispatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg border border-wireframe-border shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 my-8">
            <h3 className="font-semibold text-lg mb-4 text-foreground">Add Vehicle Dispatch / Trip</h3>
            <div className="space-y-4">
              {/* Vehicle Number & Transporter */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Vehicle Number *</label>
                  <input
                    type="text"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newDispatchVehicleNumber}
                    onChange={(e) => setNewDispatchVehicleNumber(e.target.value)}
                    placeholder="e.g. PB-10-XY-9999"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Transporter Name</label>
                  <input
                    type="text"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newDispatchTransporterName}
                    onChange={(e) => setNewDispatchTransporterName(e.target.value)}
                    placeholder="e.g. Blue Dart Logistics"
                  />
                </div>
              </div>

              {/* Driver Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Driver Name *</label>
                  <input
                    type="text"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newDispatchDriverName}
                    onChange={(e) => setNewDispatchDriverName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Driver Mobile *</label>
                  <input
                    type="text"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newDispatchDriverMobile}
                    onChange={(e) => setNewDispatchDriverMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              {/* Lorry Receipt (LR) & Cost */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-sm font-medium">LR Number</label>
                  <input
                    type="text"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newDispatchLrNumber}
                    onChange={(e) => setNewDispatchLrNumber(e.target.value)}
                    placeholder="e.g. LR-776"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <label className="text-sm font-medium">Freight Cost (₹) *</label>
                  <input
                    type="number"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newDispatchFreightCost || ""}
                    onChange={(e) => setNewDispatchFreightCost(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <label className="text-sm font-medium">Loading (₹)</label>
                  <input
                    type="number"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newDispatchLoadingCharges || ""}
                    onChange={(e) => setNewDispatchLoadingCharges(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Products Quantities Loaded */}
              <div className="border border-wireframe-border rounded-md p-3.5 bg-wireframe-bg-alt/10">
                <label className="block text-sm font-bold text-primary mb-2 uppercase tracking-wider">Quantities loaded in this vehicle</label>
                <div className="space-y-2">
                  {newDispatchProducts.map((p: any, idx: number) => (
                    <div key={p.productName} className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium">{p.productName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Ordered: {p.totalOrdered}, Dispatched: {p.alreadyDispatched}</span>
                        <input
                          type="number"
                          className="w-24 border border-input bg-background rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-bold text-center"
                          value={p.quantity || ""}
                          onChange={(e) => {
                            const newProds = [...newDispatchProducts];
                            newProds[idx] = { ...newProds[idx], quantity: Number(e.target.value) };
                            setNewDispatchProducts(newProds);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Remarks / Trip Notes</label>
                <textarea
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm min-h-[60px]"
                  value={newDispatchRemarks}
                  onChange={(e) => setNewDispatchRemarks(e.target.value)}
                  placeholder="Any logistics or route notes..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-wireframe-border">
                <button
                  onClick={() => setIsAddingDispatch(false)}
                  className="px-4 py-2 border border-wireframe-border rounded-md text-sm font-medium hover:bg-wireframe-bg-alt"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createDispatchMutation.mutate({
                    orderId,
                    vehicleNumber: newDispatchVehicleNumber,
                    transporterName: newDispatchTransporterName,
                    driverName: newDispatchDriverName,
                    driverMobile: newDispatchDriverMobile,
                    lrNumber: newDispatchLrNumber,
                    freightCost: newDispatchFreightCost,
                    loadingCharges: newDispatchLoadingCharges,
                    remarks: newDispatchRemarks,
                    products: newDispatchProducts.map(p => ({ productName: p.productName, quantity: p.quantity })),
                    status: "FREIGHT_APPROVAL_PENDING"
                  })}
                  disabled={createDispatchMutation.isPending || !newDispatchVehicleNumber || !newDispatchDriverName || !newDispatchDriverMobile}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  type="button"
                >
                  Request Freight Approval
                </button>
                <button
                  onClick={() => createDispatchMutation.mutate({
                    orderId,
                    vehicleNumber: newDispatchVehicleNumber,
                    transporterName: newDispatchTransporterName,
                    driverName: newDispatchDriverName,
                    driverMobile: newDispatchDriverMobile,
                    lrNumber: newDispatchLrNumber,
                    freightCost: newDispatchFreightCost,
                    loadingCharges: newDispatchLoadingCharges,
                    remarks: newDispatchRemarks,
                    products: newDispatchProducts.map(p => ({ productName: p.productName, quantity: p.quantity })),
                    status: "PLANNED"
                  })}
                  disabled={createDispatchMutation.isPending || !newDispatchVehicleNumber || !newDispatchDriverName || !newDispatchDriverMobile}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  type="button"
                >
                  Create planned Trip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Record Transporter Payment Modal */}
      {isRecordingTransporterPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-wireframe-border shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <h3 className="font-semibold text-lg mb-2 text-foreground">Record Transporter Payment</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Enter payment remarks and upload transport receipts / transaction proofs for this dispatch.
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Payment Remarks</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentRemarksText}
                  onChange={(e) => setPaymentRemarksText(e.target.value)}
                  placeholder="e.g. Paid via HDFC bank transfer ref 8876"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Upload Payment Proof (JPG, PNG, PDF) *</label>
                <input
                  type="file"
                  className="w-full text-xs text-muted-foreground border border-input rounded-md p-2"
                  onChange={handleProofUpload}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                {isUploading && (
                  <div className="text-xs text-primary font-medium animate-pulse">Uploading file to server...</div>
                )}
                {paymentProofUrl && (
                  <div className="text-xs text-green-700 font-medium">
                    ✓ Proof Uploaded: <a href={paymentProofUrl} target="_blank" rel="noreferrer" className="underline font-bold">View uploaded file</a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-wireframe-border pt-4">
              <button
                onClick={() => {
                  setIsRecordingTransporterPayment(false);
                  setPaymentRemarksText("");
                  setPaymentProofUrl("");
                }}
                className="px-4 py-2 border border-wireframe-border rounded-md text-sm font-medium hover:bg-wireframe-bg-alt"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => recordTransporterPaymentMutation.mutate()}
                disabled={recordTransporterPaymentMutation.isPending || isUploading || !paymentProofUrl}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                type="button"
              >
                {recordTransporterPaymentMutation.isPending ? "Saving..." : "Confirm & Save"}
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
