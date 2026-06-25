import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/orders/")({
  component: OrdersList,
});

const mockOrders = [
  {
    id: "ORD-2023-001",
    date: "2023-10-26",
    customer: "Acme Corp",
    firm: "Longowal Industries",
    productName: "Poultry Feed (Broiler)",
    quantity: "500 MT",
    orderValue: "₹1,50,00,000",
    dispatchStatus: "Pending",
    paymentStatus: "Unpaid",
    status: "Confirmed",
  },
  {
    id: "ORD-2023-002",
    date: "2023-10-25",
    customer: "Global Foods",
    firm: "Longowal Feeds",
    productName: "Cattle Feed",
    quantity: "200 MT",
    orderValue: "₹40,00,000",
    dispatchStatus: "In Transit",
    paymentStatus: "Partial",
    status: "Approved",
  },
];

function OrdersList() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage sales orders and track their fulfillment.</p>
        </div>
        <Link
          to="/orders/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create New Order
        </Link>
      </div>

      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-wireframe-border flex flex-wrap gap-4 bg-wireframe-bg-alt/50">
          <input
            type="text"
            placeholder="Search orders..."
            className="border border-input bg-background rounded px-3 py-2 text-sm w-64"
          />
          <select className="border border-input bg-background rounded px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
          </select>
          <select className="border border-input bg-background rounded px-3 py-2 text-sm">
            <option value="">All Firms</option>
            <option value="industries">Longowal Industries</option>
            <option value="feeds">Longowal Feeds</option>
          </select>
          <input 
            type="date"
            className="border border-input bg-background rounded px-3 py-2 text-sm text-muted-foreground"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt border-b border-wireframe-border">
              <tr>
                <th className="px-6 py-3 font-medium">Order Number</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Firm</th>
                <th className="px-6 py-3 font-medium">Product & Qty</th>
                <th className="px-6 py-3 font-medium">Order Value</th>
                <th className="px-6 py-3 font-medium">Dispatch Status</th>
                <th className="px-6 py-3 font-medium">Payment Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr key={order.id} className="border-b border-wireframe-border hover:bg-wireframe-bg-alt/50">
                  <td className="px-6 py-4 font-medium text-primary hover:underline cursor-pointer">
                    <Link to={`/orders/${order.id}`}>{order.id}</Link>
                  </td>
                  <td className="px-6 py-4">{order.date}</td>
                  <td className="px-6 py-4 font-medium">{order.customer}</td>
                  <td className="px-6 py-4">{order.firm}</td>
                  <td className="px-6 py-4">
                    <div>{order.productName}</div>
                    <div className="text-xs text-muted-foreground font-medium">{order.quantity}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{order.orderValue}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${
                      order.dispatchStatus === 'In Transit' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.dispatchStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${
                      order.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/orders/${order.id}`} className="p-1 text-muted-foreground hover:text-foreground" title="View">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </Link>
                      <button className="p-1 text-muted-foreground hover:text-foreground" title="Edit">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-wireframe-border flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing 1 to 2 of 2 entries</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-wireframe-border rounded hover:bg-wireframe-bg-alt disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 border border-wireframe-border rounded bg-primary text-primary-foreground">1</button>
            <button className="px-3 py-1 border border-wireframe-border rounded hover:bg-wireframe-bg-alt disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
