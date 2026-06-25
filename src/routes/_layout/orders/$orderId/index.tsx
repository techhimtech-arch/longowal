import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_layout/orders/$orderId/")({
  component: OrderDetail,
});

function OrderDetail() {
  const { orderId } = Route.useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "logistics", label: "Logistics" },
    { id: "dispatch", label: "Dispatch" },
    { id: "invoice", label: "Invoice & Payments" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/orders" className="hover:text-foreground">Orders</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{orderId}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{orderId}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Approved
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-wireframe-border rounded-md font-medium hover:bg-wireframe-bg-alt transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print
          </button>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium">
            Edit Order
          </button>
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
      <div>
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
                    <tr className="border-b border-wireframe-border">
                      <td className="px-4 py-3 font-medium">Poultry Feed (Broiler)</td>
                      <td className="px-4 py-3">500 MT</td>
                      <td className="px-4 py-3">₹30,000</td>
                      <td className="px-4 py-3 text-right font-medium">₹1,50,00,000</td>
                    </tr>
                    <tr className="bg-wireframe-bg-alt/20">
                      <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total Order Value</td>
                      <td className="px-4 py-3 text-right font-bold text-primary text-base">₹1,50,00,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Order Timeline */}
              <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm">
                <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium">
                  Order Timeline
                </div>
                <div className="p-5">
                  <div className="relative border-l border-wireframe-border ml-3 space-y-6 pb-4">
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 ring-4 ring-background"></div>
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Oct 26, 2023 - 10:30 AM</span>
                        <h4 className="font-medium mt-1">MD Approved</h4>
                        <p className="text-sm text-muted-foreground mt-1">Order approved by Rohan Kapoor. Sent to Logistics.</p>
                      </div>
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-wireframe-border rounded-full -left-[6.5px] top-1.5 ring-4 ring-background"></div>
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Oct 25, 2023 - 4:15 PM</span>
                        <h4 className="font-medium mt-1">Order Submitted</h4>
                        <p className="text-sm text-muted-foreground mt-1">Sales executive submitted order for approval.</p>
                      </div>
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-wireframe-border rounded-full -left-[6.5px] top-1.5 ring-4 ring-background"></div>
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Oct 25, 2023 - 2:00 PM</span>
                        <h4 className="font-medium mt-1">Draft Created</h4>
                        <p className="text-sm text-muted-foreground mt-1">Order created by Amit Singh.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-1 space-y-6">
              {/* Customer Details */}
              <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-5 space-y-4">
                <h3 className="font-semibold text-lg border-b border-wireframe-border pb-2">Customer & Firm</h3>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <Link to="/leads" className="font-medium text-primary hover:underline">Acme Corp</Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Execution Firm</p>
                  <p className="font-medium">Longowal Industries</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sales Executive</p>
                  <p className="font-medium">Amit Singh</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "logistics" && (
          <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-6">
            <h3 className="font-medium text-lg mb-6">Transport Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="grid grid-cols-2 pb-2 border-b border-wireframe-border/50">
                  <span className="text-muted-foreground">Transporter</span>
                  <span className="font-medium text-right">FastTrack Logistics</span>
                </div>
                <div className="grid grid-cols-2 pb-2 border-b border-wireframe-border/50">
                  <span className="text-muted-foreground">Vehicle Number</span>
                  <span className="font-medium text-right">MH 12 AB 1234</span>
                </div>
                <div className="grid grid-cols-2 pb-2 border-b border-wireframe-border/50">
                  <span className="text-muted-foreground">Driver Details</span>
                  <span className="font-medium text-right">Raju (9876543210)</span>
                </div>
              </div>
              <div className="space-y-4 bg-wireframe-bg-alt/30 p-4 rounded-lg border border-wireframe-border">
                <h4 className="font-medium mb-2 text-primary">Freight & Costs</h4>
                <div className="grid grid-cols-2 pb-2 border-b border-wireframe-border/50">
                  <span className="text-muted-foreground">Freight Cost</span>
                  <span className="font-medium text-right">₹45,000</span>
                </div>
                <div className="grid grid-cols-2 pb-2 border-b border-wireframe-border/50">
                  <span className="text-muted-foreground">Loading Charges</span>
                  <span className="font-medium text-right">₹5,000</span>
                </div>
                <div className="grid grid-cols-2 pt-2">
                  <span className="font-bold">Total Logistics Cost</span>
                  <span className="font-bold text-right text-primary">₹50,000</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "dispatch" && (
          <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-lg">Dispatch Information</h3>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                In Transit
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-wireframe-bg-alt/30 rounded border border-wireframe-border">
                <p className="text-sm text-muted-foreground mb-1">Dispatch Date</p>
                <p className="font-medium">Oct 28, 2023</p>
              </div>
              <div className="p-4 bg-wireframe-bg-alt/30 rounded border border-wireframe-border">
                <p className="text-sm text-muted-foreground mb-1">Expected Delivery</p>
                <p className="font-medium">Oct 30, 2023</p>
              </div>
              <div className="p-4 bg-wireframe-bg-alt/30 rounded border border-wireframe-border">
                <p className="text-sm text-muted-foreground mb-1">LR Number</p>
                <p className="font-medium">LR-99887766</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "invoice" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium flex justify-between">
                  <span>Payments History</span>
                  <button className="text-sm text-primary hover:underline">Record Payment</button>
                </div>
                <div className="p-4">
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
                      <tr className="border-b border-wireframe-border">
                        <td className="px-4 py-3">Oct 25, 2023</td>
                        <td className="px-4 py-3">Bank Transfer</td>
                        <td className="px-4 py-3">NEFT-123456789</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">₹50,00,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-5 space-y-4">
                <h3 className="font-semibold text-lg border-b border-wireframe-border pb-2">Financial Summary</h3>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Amount</span>
                  <span className="font-medium">₹1,50,00,000</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Received Amount</span>
                  <span className="font-medium">- ₹50,00,000</span>
                </div>
                <div className="flex justify-between border-t border-wireframe-border pt-2 mt-2">
                  <span className="font-bold">Outstanding</span>
                  <span className="font-bold text-red-600">₹1,00,00,000</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
