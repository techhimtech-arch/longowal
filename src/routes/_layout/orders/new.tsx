import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/_layout/orders/new")({
  component: CreateOrder,
});

function CreateOrder() {
  const [products, setProducts] = useState([
    { id: 1, product: "", quantity: 0, unit: "MT", rate: 0 }
  ]);
  const [advanceAmount, setAdvanceAmount] = useState(0);

  const handleProductChange = (index: number, field: string, value: string | number) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const addProduct = () => {
    setProducts([...products, { id: Date.now(), product: "", quantity: 0, unit: "MT", rate: 0 }]);
  };

  const removeProduct = (index: number) => {
    const newProducts = [...products];
    newProducts.splice(index, 1);
    setProducts(newProducts);
  };

  const totalOrderValue = useMemo(() => {
    return products.reduce((acc, curr) => acc + (curr.quantity * curr.rate), 0);
  }, [products]);

  const balanceAmount = useMemo(() => {
    return totalOrderValue - advanceAmount;
  }, [totalOrderValue, advanceAmount]);

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
          <button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md font-medium">
            Save as Draft
          </button>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium shadow">
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
              <input type="date" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Select Customer</label>
              <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm">
                <option value="">Search Customer...</option>
                <option value="acme">Acme Corp</option>
                <option value="global">Global Foods</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Execution Firm</label>
              <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm">
                <option value="">Select Firm</option>
                <option value="industries">Longowal Industries</option>
                <option value="feeds">Longowal Feeds</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sales Executive</label>
              <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm">
                <option value="">Select Executive</option>
                <option value="rohan">Rohan Kapoor</option>
                <option value="amit">Amit Singh</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Product Information */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium text-primary flex justify-between items-center">
            <span>Section 2: Product Information</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
              Total: ₹{totalOrderValue.toLocaleString()}
            </span>
          </div>
          <div className="p-4 space-y-4">
            <div className="border border-wireframe-border rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-wireframe-bg-alt/50 border-b border-wireframe-border">
                  <tr>
                    <th className="px-4 py-3 font-medium w-[40%]">Product</th>
                    <th className="px-4 py-3 font-medium">Quantity</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium">Rate (₹)</th>
                    <th className="px-4 py-3 font-medium">Total (₹)</th>
                    <th className="px-4 py-3 font-medium text-center w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item, index) => (
                    <tr key={item.id} className="border-b border-wireframe-border last:border-b-0">
                      <td className="px-4 py-3">
                        <select 
                          className="w-full border border-input bg-background rounded px-3 py-1.5 text-sm"
                          value={item.product}
                          onChange={(e) => handleProductChange(index, "product", e.target.value)}
                        >
                          <option value="">Select Product...</option>
                          <option value="poultry_broiler">Poultry Feed (Broiler)</option>
                          <option value="poultry_layer">Poultry Feed (Layer)</option>
                          <option value="cattle_feed">Cattle Feed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          min="0"
                          className="w-full border border-input bg-background rounded px-3 py-1.5 text-sm"
                          value={item.quantity || ""}
                          onChange={(e) => handleProductChange(index, "quantity", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          className="w-full border border-input bg-background rounded px-3 py-1.5 text-sm"
                          value={item.unit}
                          onChange={(e) => handleProductChange(index, "unit", e.target.value)}
                        >
                          <option value="MT">MT</option>
                          <option value="KG">KG</option>
                          <option value="Bags">Bags</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          min="0"
                          className="w-full border border-input bg-background rounded px-3 py-1.5 text-sm"
                          value={item.rate || ""}
                          onChange={(e) => handleProductChange(index, "rate", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium bg-wireframe-bg-alt/30">
                        {(item.quantity * item.rate).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
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
            Section 3: Delivery Information
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Delivery Location / Address</label>
              <textarea 
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm min-h-[100px]" 
                placeholder="Full delivery address..."
              ></textarea>
            </div>
            <div className="space-y-4 col-span-2 md:col-span-1">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Dispatch Location (Plant)</label>
                <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm">
                  <option value="">Select Plant</option>
                  <option value="plant1">Plant 1 - Main</option>
                  <option value="plant2">Plant 2 - North</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Required Delivery Date</label>
                <input type="date" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Financial Details */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium text-primary">
            Section 4: Financial Details
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-wireframe-bg-alt/50 p-4 rounded-md border border-wireframe-border">
              <p className="text-sm text-muted-foreground mb-1">Total Order Value</p>
              <p className="text-2xl font-bold">₹{totalOrderValue.toLocaleString()}</p>
            </div>
            
            <div className="space-y-1.5 p-4">
              <label className="text-sm font-medium">Advance Amount Received (₹)</label>
              <input 
                type="number" 
                min="0"
                className="w-full border border-primary/50 ring-1 ring-primary/20 bg-background rounded-md px-3 py-2 text-lg font-medium"
                value={advanceAmount || ""}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
              />
            </div>

            <div className="bg-red-50 p-4 rounded-md border border-red-100">
              <p className="text-sm text-red-600 mb-1 font-medium">Balance Amount (Calculated)</p>
              <p className="text-2xl font-bold text-red-700">₹{balanceAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
