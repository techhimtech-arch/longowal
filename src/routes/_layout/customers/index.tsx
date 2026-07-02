import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/customers/")({
  component: CustomersList,
});

function CustomersList() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Fetch paginated data
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["customers", statusFilter, categoryFilter, search, page],
    queryFn: async () => {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.customerCategory = categoryFilter;
      if (search) params.search = search;
      const res = await api.get("/customers", { params });
      return res.data;
    }
  });

  // Fetch all customers for global KPI aggregates and filter parameters
  const { data: allCustomersRes } = useQuery({
    queryKey: ["customers-all-stats"],
    queryFn: async () => {
      const res = await api.get("/customers");
      return res.data?.data || [];
    }
  });

  const customersList = response?.data || [];
  const pagination = response?.pagination || { total: 0, page: 1, limit: 10, pages: 1 };
  const allCustomers = allCustomersRes || [];

  // Calculate high level KPIs
  const totalCustomers = allCustomers.length;
  const totalOutstanding = allCustomers.reduce((acc: number, curr: any) => acc + (curr.stats?.outstandingAmount || 0), 0);
  const totalRevenue = allCustomers.reduce((acc: number, curr: any) => acc + (curr.stats?.totalRevenue || 0), 0);
  const totalOrders = allCustomers.reduce((acc: number, curr: any) => acc + (curr.stats?.totalOrders || 0), 0);

  // Extract unique categories for filter dropdown
  const categories = Array.from(new Set(allCustomers.map((c: any) => c.customerCategory).filter(Boolean)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Customer Management</h1>
          <p className="text-muted-foreground">Monitor customer profiles, accounts outstanding, billing history, and order statistics.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Customers</h3>
          <p className="text-2xl font-bold mt-1 text-foreground">{totalCustomers}</p>
          <span className="text-[11px] text-green-600 font-medium">Active database</span>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</h3>
          <p className="text-2xl font-bold mt-1 text-foreground">₹{totalRevenue.toLocaleString("en-IN")}</p>
          <span className="text-[11px] text-muted-foreground">Cumulative billed</span>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding Amount</h3>
          <p className="text-2xl font-bold mt-1 text-red-600">₹{totalOutstanding.toLocaleString("en-IN")}</p>
          <span className="text-[11px] text-red-500 font-medium">Pending collections</span>
        </div>
        <div className="bg-surface border border-wireframe-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</h3>
          <p className="text-2xl font-bold mt-1 text-foreground">{totalOrders}</p>
          <span className="text-[11px] text-muted-foreground">Order count</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-wireframe-border flex flex-wrap gap-4 bg-wireframe-bg-alt/40">
          <div className="relative flex-1 min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by company name, customer code, or contact person..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="border border-input bg-background rounded pl-10 pr-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[150px]"
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[150px]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground font-medium flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
              Loading customers...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600 font-medium">
              Error loading customers: {(error as any).message || "Unknown error"}
            </div>
          ) : customersList.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">
              No customers found.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt border-b border-wireframe-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-6 py-3 font-medium">Company Name</th>
                  <th className="px-6 py-3 font-medium">Contact Person</th>
                  <th className="px-6 py-3 font-medium">City &amp; State</th>
                  <th className="px-6 py-3 font-medium text-right">Credit Limit</th>
                  <th className="px-6 py-3 font-medium text-right">Outstanding</th>
                  <th className="px-6 py-3 font-medium text-center">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customersList.map((cust: any) => {
                  const isActive = cust.status === "ACTIVE";

                  return (
                    <tr key={cust._id} className="border-b border-wireframe-border hover:bg-wireframe-bg-alt/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-xs text-secondary-foreground">{cust.customerCode}</td>
                      <td className="px-6 py-4 font-semibold text-foreground hover:underline">
                        <Link to={`/customers/${cust._id}` as any}>
                          {cust.companyName}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{cust.primaryContact?.name}</div>
                        <div className="text-xs text-muted-foreground">{cust.primaryContact?.mobile}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {cust.billingAddress?.city || "-"}, {cust.billingAddress?.state || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        ₹{(cust.creditLimit || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-red-600">
                        ₹{(cust.stats?.outstandingAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/customers/${cust._id}` as any}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1 rounded text-xs font-semibold shadow-sm transition-all"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t border-wireframe-border flex items-center justify-between text-sm text-muted-foreground bg-wireframe-bg-alt/20">
          <div>Showing {customersList.length} of {pagination.total} customers</div>
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
