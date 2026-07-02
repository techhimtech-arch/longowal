import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/orders/")({
  component: OrdersList,
});

function OrdersList() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

  const userRoleNormalized = (user?.role || '').toLowerCase().replace(/[\s_-]/g, '');
  const isLogistics = userRoleNormalized === "logistics" || userRoleNormalized === "logisticsteam";
  const isAccounts = userRoleNormalized === "accounts" || userRoleNormalized === "citizen" || userRoleNormalized === "accountant";
  const canCreateOrder = !isLogistics && !isAccounts;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["orders", selectedStatus, search, page],
    queryFn: async () => {
      const params: any = { page, limit: 10 };
      if (selectedStatus) params.status = selectedStatus;
      if (search) params.search = search;
      const res = await api.get("/orders", { params });
      return res.data;
    },
  });

  const orders = response?.data || [];
  const pagination = response?.pagination || { total: 0, page: 1, limit: 10, pages: 1 };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage sales orders and track their fulfillment.</p>
        </div>
        {canCreateOrder && (
          <Link
            to="/orders/new"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Create New Order
          </Link>
        )}
      </div>

      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-wireframe-border flex flex-wrap gap-4 bg-wireframe-bg-alt/50">
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border border-input bg-background rounded px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select 
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_MD_APPROVAL">Pending MD Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="LOGISTICS_PENDING">Logistics Pending</option>
            <option value="DISPATCH_READY">Dispatch Ready</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground font-medium flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
              Loading orders...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600 font-medium">
              Error loading orders: {(error as any).message || "Unknown error"}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">
              No orders found.
            </div>
          ) : (
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
                {orders.map((order: any) => {
                  const orderDate = order.orderDate
                    ? new Date(order.orderDate).toLocaleDateString()
                    : "-";
                  const totalProducts = order.products?.length || 0;
                  const firstProduct = order.products?.[0];
                  const productText = firstProduct
                    ? `${firstProduct.productName} ${totalProducts > 1 ? `+ ${totalProducts - 1} more` : ""}`
                    : "-";
                  const quantityText = firstProduct
                    ? `${order.products.reduce((acc: number, cur: any) => acc + cur.quantity, 0)} ${firstProduct.unit || "units"}`
                    : "-";

                  return (
                    <tr key={order._id} className="border-b border-wireframe-border hover:bg-wireframe-bg-alt/50">
                      <td className="px-6 py-4 font-medium text-primary hover:underline cursor-pointer">
                        <Link to={`/orders/${order._id}`}>{order.orderNumber}</Link>
                      </td>
                      <td className="px-6 py-4">{orderDate}</td>
                      <td className="px-6 py-4 font-medium">{order.customerId?.companyName || "-"}</td>
                      <td className="px-6 py-4">{order.executionFirmId?.firmName || "-"}</td>
                      <td className="px-6 py-4">
                        <div>{productText}</div>
                        <div className="text-xs text-muted-foreground font-medium">{quantityText}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        ₹{(order.totalOrderValue || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'APPROVED' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${
                          order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                          order.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/orders/${order._id}`} className="p-1 text-muted-foreground hover:text-foreground" title="View details">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t border-wireframe-border flex items-center justify-between text-sm text-muted-foreground bg-wireframe-bg-alt/30">
          <div>Showing {orders.length} of {pagination.total} entries</div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-surface border border-wireframe-border rounded text-xs font-semibold disabled:opacity-50 hover:bg-wireframe-bg-alt transition-all"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-xs font-medium text-foreground">
              Page {page} of {pagination.pages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages || 1, p + 1))}
              disabled={page >= (pagination.pages || 1)}
              className="px-3 py-1 bg-surface border border-wireframe-border rounded text-xs font-semibold disabled:opacity-50 hover:bg-wireframe-bg-alt transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
