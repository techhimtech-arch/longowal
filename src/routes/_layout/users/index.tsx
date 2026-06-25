import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/users/")({
  component: UsersList,
});

const mockUsers = [
  {
    id: "USR-001",
    name: "Rohan Kapoor",
    email: "rohan@longowal.com",
    mobile: "+91 9876543210",
    role: "Admin",
    status: "Active",
  },
  {
    id: "USR-002",
    name: "Amit Singh",
    email: "amit@longowal.com",
    mobile: "+91 8765432109",
    role: "Sales Executive",
    status: "Active",
  },
  {
    id: "USR-003",
    name: "Priya Patel",
    email: "priya@longowal.com",
    mobile: "+91 7654321098",
    role: "Accounts",
    status: "Inactive",
  },
];

function UsersList() {
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
            className="border border-input bg-background rounded px-3 py-2 text-sm w-80"
          />
          <select className="border border-input bg-background rounded px-3 py-2 text-sm">
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Sales Executive">Sales Executive</option>
            <option value="Operations">Operations</option>
            <option value="Accounts">Accounts</option>
          </select>
          <select className="border border-input bg-background rounded px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
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
              {mockUsers.map((user) => (
                <tr key={user.id} className="border-b border-wireframe-border hover:bg-wireframe-bg-alt/50">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {user.name.charAt(0)}
                    </div>
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">{user.mobile}</td>
                  <td className="px-6 py-4">
                    <span className="bg-secondary/10 text-secondary-foreground border border-secondary/20 px-2.5 py-0.5 rounded text-xs font-medium">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-muted-foreground hover:text-foreground" title="Edit">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button 
                        className={`p-1 ${user.status === 'Active' ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
                        title={user.status === 'Active' ? 'Disable User' : 'Enable User'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {user.status === 'Active' ? 'block' : 'check_circle'}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-wireframe-border flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing 1 to 3 of 3 entries</div>
        </div>
      </div>
    </div>
  );
}
