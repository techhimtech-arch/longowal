import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/orders/new")({
  component: CreateOrder,
});

interface ProductRow {
  id: number;
  productName: string;
  quantity: number;
  unit: string;
  supplyRate: number;
  freight: number;
  margin: number;
  gstPercent: number;
  gstAmount: number;
  rate: number;
  total: number;
}

function CreateOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form states
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [customerId, setCustomerId] = useState("");
  const [executionFirmId, setExecutionFirmId] = useState("");
  const [salesExecutiveId, setSalesExecutiveId] = useState(user?.id || "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [dispatchLocation, setDispatchLocation] = useState("");
  const [plantName, setPlantName] = useState("");
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState("");
  const [estimatedFreight, setEstimatedFreight] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [expectedPaymentDate, setExpectedPaymentDate] = useState("");

  // Products rows
  const [products, setProducts] = useState<ProductRow[]>([
    { id: 1, productName: "", quantity: 0, unit: "tons", supplyRate: 0, freight: 0, margin: 0, gstPercent: 0, gstAmount: 0, rate: 0, total: 0 }
  ]);

  // Fetch Customers list
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await api.get("/customers");
      return res.data?.data || [];
    }
  });

  // Fetch Firms list
  const { data: firms = [] } = useQuery({
    queryKey: ["firms"],
    queryFn: async () => {
      const res = await api.get("/firms");
      return res.data?.data || [];
    }
  });

  // Fetch Master Plants
  const { data: masterPlants = [] } = useQuery({
    queryKey: ["masterPlants"],
    queryFn: async () => {
      const res = await api.get("/masters?category=PLANT");
      return res.data?.data || [];
    }
  });

  // Fetch Master Products
  const { data: masterProducts = [] } = useQuery({
    queryKey: ["masterProducts"],
    queryFn: async () => {
      const res = await api.get("/masters?category=PRODUCT");
      return res.data?.data || [];
    }
  });

  // Fetch users for assignment dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const res = await api.get("/users");
        return res.data?.data || [];
      } catch (e) {
        return [];
      }
    }
  });

  const handleProductChange = (index: number, field: keyof ProductRow, value: string | number) => {
    const newProducts = [...products];
    const row = { ...newProducts[index] };
    
    if (field === "productName" || field === "unit") {
      row[field] = value as any;
    } else {
      row[field] = Number(value) as any;
    }

    const quantity = Number(row.quantity || 0);
    const supplyRate = Number(row.supplyRate || 0);
    const freight = Number(row.freight || 0);
    const gstPercent = Number(row.gstPercent || 0);

    if (field === "rate") {
      const rate = Number(value || 0);
      const baseRate = rate / (1 + gstPercent / 100);
      row.margin = Number((baseRate - supplyRate - freight).toFixed(2));
      row.gstAmount = Number((baseRate * (gstPercent / 100)).toFixed(2));
    } else {
      const margin = Number(row.margin || 0);
      const baseRate = supplyRate + freight + margin;
      const gstAmount = baseRate * (gstPercent / 100);
      row.gstAmount = Number(gstAmount.toFixed(2));
      row.rate = Number((baseRate + gstAmount).toFixed(2));
    }
    
    row.total = Number((quantity * (row.rate || 0)).toFixed(2));
    newProducts[index] = row;
    setProducts(newProducts);
  };

  const addProduct = () => {
    setProducts([...products, { id: Date.now(), productName: "", quantity: 0, unit: "tons", supplyRate: 0, freight: 0, margin: 0, gstPercent: 0, gstAmount: 0, rate: 0, total: 0 }]);
  };

  const removeProduct = (index: number) => {
    const newProducts = [...products];
    newProducts.splice(index, 1);
    setProducts(newProducts);
  };

  // Calculations
  const totalOrderValue = useMemo(() => {
    return products.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [products]);

  const balanceAmount = useMemo(() => {
    return totalOrderValue - advanceAmount;
  }, [totalOrderValue, advanceAmount]);

  // Mutation for creating the order
  const orderMutation = useMutation({
    mutationFn: async (status: string) => {
      // Map products to API schema (adding calculated total per product)
      const mappedProducts = products
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
          total: p.total,
        }));

      if (mappedProducts.length === 0) {
        throw new Error("Please add at least one valid product");
      }

      if (!customerId) {
        throw new Error("Please select a Customer");
      }

      const payload = {
        customerId,
        executionFirmId: executionFirmId || undefined,
        salesExecutiveId: salesExecutiveId || user?.id,
        orderDate: new Date(orderDate).toISOString(),
        products: mappedProducts,
        deliveryAddress,
        dispatchLocation,
        plantName,
        requiredDeliveryDate: requiredDeliveryDate ? new Date(requiredDeliveryDate).toISOString() : undefined,
        estimatedFreight,
        totalOrderValue,
        advanceAmount,
        balanceAmount,
        remarks,
        expectedPaymentDate: expectedPaymentDate ? new Date(expectedPaymentDate).toISOString() : undefined,
        status, // 'DRAFT' or 'PENDING_MD_APPROVAL'
      };

      const res = await api.post("/orders", payload);
      return res.data;
    },
    onSuccess: (_, status) => {
      toast.success(`Order successfully saved as ${status === "DRAFT" ? "Draft" : "Pending MD Approval"}!`);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate({ to: "/orders" });
    },
    onError: (error: any) => {
      console.error(error);
    }
  });

  const handleSave = (status: "DRAFT" | "PENDING_MD_APPROVAL") => {
    orderMutation.mutate(status);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/orders" className="hover:text-foreground">Orders</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Create New Order</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Order</h1>
        </div>
        <div className="flex gap-3">
          <Link
            to="/orders"
            className="px-4 py-2 border border-wireframe-border rounded-md font-medium hover:bg-wireframe-bg-alt transition-colors"
          >
            Cancel
          </Link>
          <button 
            onClick={() => handleSave("DRAFT")}
            disabled={orderMutation.isPending}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md font-medium disabled:opacity-75"
          >
            Save as Draft
          </button>
          <button 
            onClick={() => handleSave("PENDING_MD_APPROVAL")}
            disabled={orderMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium shadow disabled:opacity-75"
          >
            Confirm Order
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1: Order Information */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium text-primary">
            Section 1: Order Information
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Order Date</label>
              <input 
                type="date" 
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" 
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Select Customer *</label>
              <select 
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Search Customer...</option>
                {customers.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName} ({c.customerCode || "No Code"})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Execution Firm</label>
              <select 
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={executionFirmId}
                onChange={(e) => setExecutionFirmId(e.target.value)}
              >
                <option value="">Select Firm</option>
                {firms.map((f: any) => (
                  <option key={f._id} value={f._id}>
                    {f.firmName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sales Executive</label>
              <select 
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={salesExecutiveId}
                onChange={(e) => setSalesExecutiveId(e.target.value)}
              >
                <option value="">Select Executive</option>
                {users.length > 0 ? (
                  users.map((u: any) => (
                    <option key={u._id} value={u._id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))
                ) : (
                  user && (
                    <option value={user.id}>
                      {user.name}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Product Information */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium text-primary flex justify-between items-center">
            <span>Section 2: Product Information</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
              Total: ₹{totalOrderValue.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-4 space-y-4">
            <div className="border border-wireframe-border rounded-md overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[900px]">
                <thead className="bg-wireframe-bg-alt/50 border-b border-wireframe-border">
                  <tr>
                    <th className="px-3 py-2 font-medium w-[22%]">Product</th>
                    <th className="px-3 py-2 font-medium w-[8%]">Quantity</th>
                    <th className="px-3 py-2 font-medium w-[10%]">Unit</th>
                    <th className="px-3 py-2 font-medium w-[11%]">Supply Rate (₹)</th>
                    <th className="px-3 py-2 font-medium w-[10%]">Freight (₹)</th>
                    <th className="px-3 py-2 font-medium w-[10%]">Margin (₹)</th>
                    <th className="px-3 py-2 font-medium w-[8%]">GST %</th>
                    <th className="px-3 py-2 font-medium w-[11%]">Selling Rate (₹)</th>
                    <th className="px-3 py-2 font-medium w-[10%] text-right font-semibold">Total (₹)</th>
                    <th className="px-3 py-2 font-medium text-center w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item, index) => (
                    <tr key={item.id} className="border-b border-wireframe-border last:border-b-0">
                      <td className="px-3 py-2">
                        <select
                          className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                          value={item.productName}
                          onChange={(e) => {
                            const prodName = e.target.value;
                            const match = masterProducts.find((p: any) => p.key === prodName);
                            if (match) {
                              const newProducts = [...products];
                              newProducts[index] = {
                                ...newProducts[index],
                                productName: prodName,
                                unit: match.value?.defaultUnit || "tons",
                                gstPercent: match.value?.defaultGstPercent || 0
                              };
                              setProducts(newProducts);
                              handleProductChange(index, "productName", prodName);
                            } else {
                              handleProductChange(index, "productName", prodName);
                            }
                          }}
                        >
                          <option value="">Select Product</option>
                          {masterProducts.map((p: any) => (
                            <option key={p._id} value={p.key}>
                              {p.value?.name || p.key}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          min="0"
                          className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          value={item.quantity || ""}
                          onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select 
                          className="w-full border border-input bg-background rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          value={item.unit}
                          onChange={(e) => handleProductChange(index, "unit", e.target.value)}
                        >
                          <option value="tons">tons</option>
                          <option value="kg">kg</option>
                          <option value="bags">bags</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          placeholder="0"
                          className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          value={item.supplyRate || ""}
                          onChange={(e) => handleProductChange(index, "supplyRate", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          placeholder="0"
                          className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          value={item.freight || ""}
                          onChange={(e) => handleProductChange(index, "freight", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0"
                          className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          value={item.margin || ""}
                          onChange={(e) => handleProductChange(index, "margin", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          placeholder="0"
                          className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          value={item.gstPercent || ""}
                          onChange={(e) => handleProductChange(index, "gstPercent", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          placeholder="0"
                          className="w-full border border-input bg-background rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          value={item.rate || ""}
                          onChange={(e) => handleProductChange(index, "rate", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium bg-wireframe-bg-alt/30 text-right">
                        ₹{(item.total || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button 
                          onClick={() => removeProduct(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                          disabled={products.length === 1}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div>
              <button 
                onClick={addProduct}
                className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add Another Product
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Delivery Information */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium text-primary">
            Section 3: Delivery & Dispatch Information
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Delivery Address</label>
              <textarea 
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary" 
                placeholder="Full delivery address..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              ></textarea>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Dispatch Location (Plant Gate)</label>
                <input 
                  type="text" 
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Factory Gate 1"
                  value={dispatchLocation}
                  onChange={(e) => setDispatchLocation(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Plant Name *</label>
                <select
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
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
                <label className="text-sm font-medium">Required Delivery Date</label>
                <input 
                  type="date" 
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={requiredDeliveryDate}
                  onChange={(e) => setRequiredDeliveryDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Estimated Freight (₹)</label>
                <input 
                  type="number" 
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                  value={estimatedFreight || ""}
                  onChange={(e) => setEstimatedFreight(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Financial & Additional Details */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium text-primary">
            Section 4: Financial & Additional Details
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-wireframe-bg-alt/50 p-4 rounded-md border border-wireframe-border flex flex-col justify-center">
                <p className="text-sm text-muted-foreground mb-1">Total Order Value</p>
                <p className="text-2xl font-bold">₹{totalOrderValue.toLocaleString("en-IN")}</p>
              </div>
              
              <div className="space-y-1.5 p-4 border border-input rounded-md">
                <label className="text-sm font-medium text-primary">Advance Amount (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full border border-primary/30 bg-background rounded px-3 py-1.5 text-lg font-bold"
                  value={advanceAmount || ""}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5 p-4 border border-primary/30 rounded-md bg-primary-container/10">
                <label className="text-sm font-medium text-primary font-bold">Expected Payment Date *</label>
                <input 
                  type="date" 
                  className="w-full border border-primary/30 bg-background rounded px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  value={expectedPaymentDate}
                  onChange={(e) => setExpectedPaymentDate(e.target.value)}
                />
              </div>

              <div className="bg-red-50 p-4 rounded-md border border-red-100 flex flex-col justify-center">
                <p className="text-sm text-red-600 mb-1 font-medium">Balance Amount</p>
                <p className="text-2xl font-bold text-red-700">₹{balanceAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Remarks / Instructions</label>
              <textarea 
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary" 
                placeholder="Special remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
