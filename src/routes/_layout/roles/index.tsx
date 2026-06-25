import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/roles/")({
  component: RolePermissions,
});

const modules = [
  "Leads",
  "Customers",
  "Orders",
  "Logistics",
  "Dispatch",
  "Invoices",
  "Payments",
  "Reports"
];

const permissions = ["View", "Create", "Edit", "Delete", "Approve"];

function RolePermissions() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/users" className="hover:text-foreground">Users</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Role Permissions</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Role Permissions</h1>
          <p className="text-muted-foreground">Configure access control and permissions for different user roles.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/users"
            className="px-4 py-2 border border-wireframe-border rounded-md font-medium hover:bg-wireframe-bg-alt transition-colors"
          >
            Cancel
          </Link>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium shadow-sm">
            Save Permissions
          </button>
        </div>
      </div>

      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-wireframe-border flex flex-wrap gap-4 bg-wireframe-bg-alt/50 items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap">Select Role to Edit:</label>
            <select className="border border-input bg-background rounded px-3 py-2 text-sm w-64">
              <option value="Sales Executive">Sales Executive</option>
              <option value="Operations">Operations Team</option>
              <option value="Accounts">Accounts Team</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <span className="text-sm text-muted-foreground">Admin has full access by default.</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-wireframe-bg-alt/30 border-b border-wireframe-border">
              <tr>
                <th className="px-6 py-4 font-medium w-1/4 border-r border-wireframe-border">Module</th>
                {permissions.map(perm => (
                  <th key={perm} className="px-4 py-4 font-medium text-center">{perm}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <tr key={mod} className="border-b border-wireframe-border hover:bg-wireframe-bg-alt/20">
                  <td className="px-6 py-4 font-medium border-r border-wireframe-border bg-wireframe-bg-alt/10">
                    {mod}
                  </td>
                  {permissions.map(perm => {
                    // Logic to simulate Sales Executive default permissions
                    const isChecked = 
                      (perm === "View" && mod !== "Reports") || 
                      (perm === "Create" && ["Leads", "Customers", "Orders"].includes(mod)) ||
                      (perm === "Edit" && ["Leads", "Orders"].includes(mod));

                    return (
                      <td key={`${mod}-${perm}`} className="px-4 py-4 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-primary rounded border-wireframe-border focus:ring-primary/50"
                            defaultChecked={isChecked}
                          />
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
