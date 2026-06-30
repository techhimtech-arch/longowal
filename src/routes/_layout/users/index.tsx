import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/users/")({
  component: UsersList,
});

function mapUserTypeToRole(userType: string): string {
  if (userType === "SUPER_ADMIN") return "Admin";
  if (userType === "ORG_ADMIN") return "Sales Executive";
  if (userType === "VOLUNTEER") return "Operations";
  if (userType === "CITIZEN") return "Accounts";
  if (userType === "LOGISTICS_TEAM") return "Logistics";
  return "Sales Executive";
}

function UsersList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Query users
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["users", selectedStatus, selectedRole, search],
    queryFn: async () => {
      const params: any = {
        limit: 100,
      };
      if (selectedStatus) {
        params.status = selectedStatus === "Active" ? "ACTIVE" : "INACTIVE";
      }
      if (selectedRole) {
        if (selectedRole === "Admin") params.role = "SUPER_ADMIN";
        else if (selectedRole === "Sales Executive") params.role = "ORG_ADMIN";
        else if (selectedRole === "Operations") params.role = "VOLUNTEER";
        else if (selectedRole === "Accounts") params.role = "CITIZEN";
        else if (selectedRole === "Logistics") params.role = "LOGISTICS_TEAM";
      }
      if (search) {
        params.search = search;
      }
      const res = await api.get("/users", { params });
      return res.data;
    },
  });

  const usersList = response?.data || [];

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, currentStatus }: { userId: string; currentStatus: string }) => {
      const targetStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await api.put(`/users/${userId}`, { status: targetStatus });
      return res.data;
    },
    onSuccess: () => {
      toast.success("User status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      console.error(err);
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage employee access, roles, and system permissions.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/roles"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md font-medium flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">shield_person</span>
            Role Permissions
          </Link>
          <Link
            to="/users/new"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Add New User
          </Link>
        </div>
      </div>

      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-wireframe-border flex flex-wrap gap-4 bg-wireframe-bg-alt/50">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-input bg-background rounded px-3 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Sales Executive">Sales Executive</option>
            <option value="Operations">Operations</option>
            <option value="Accounts">Accounts</option>
            <option value="Logistics">Logistics</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground font-medium flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
              Loading users...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600 font-medium">
              Error loading users: {(error as any).message || "Unknown error"}
            </div>
          ) : usersList.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">
              No users found.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt border-b border-wireframe-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Mobile</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((usr: any) => {
                  const mappedRole = mapUserTypeToRole(usr.userType);
                  const isUserActive = usr.status === "ACTIVE";

                  return (
                    <tr key={usr.id} className="border-b border-wireframe-border hover:bg-wireframe-bg-alt/50">
                      <td className="px-6 py-4 font-medium flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase">
                          {usr.firstName ? usr.firstName.charAt(0) : "U"}
                        </div>
                        {usr.firstName} {usr.lastName}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{usr.email}</td>
                      <td className="px-6 py-4">{usr.phoneNumber || "-"}</td>
                      <td className="px-6 py-4">
                        <span className="bg-secondary/10 text-secondary-foreground border border-secondary/20 px-2.5 py-0.5 rounded text-xs font-medium">
                          {mappedRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isUserActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isUserActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleStatusMutation.mutate({ userId: usr.id, currentStatus: usr.status })}
                            disabled={toggleStatusMutation.isPending}
                            className={`p-1 flex items-center justify-center rounded transition-all ${
                              isUserActive ? 'text-red-500 hover:text-red-700 hover:bg-red-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                            }`}
                            title={isUserActive ? 'Disable User' : 'Enable User'}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {isUserActive ? 'block' : 'check_circle'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t border-wireframe-border flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing {usersList.length} entries</div>
        </div>
      </div>
    </div>
  );
}
