import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/users/new")({
  component: CreateUser,
});

function CreateUser() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/users" className="hover:text-foreground">Users</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Create New User</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New User</h1>
        </div>
      </div>

      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full Name</label>
              <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="e.g. John Doe" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email Address</label>
              <input type="email" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="john@example.com" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mobile Number</label>
              <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="+91 00000 00000" />
            </div>

            <div className="space-y-1.5 border-t border-wireframe-border pt-6 mt-2">
              <label className="text-sm font-medium">Assign Role</label>
              <p className="text-xs text-muted-foreground mb-3">Select the appropriate role to grant the user specific system permissions.</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 border border-wireframe-border rounded-md hover:bg-wireframe-bg-alt cursor-pointer">
                  <input type="radio" name="role" className="w-4 h-4 text-primary" defaultChecked />
                  <div>
                    <span className="block font-medium text-sm">Sales Executive</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-wireframe-border rounded-md hover:bg-wireframe-bg-alt cursor-pointer">
                  <input type="radio" name="role" className="w-4 h-4 text-primary" />
                  <div>
                    <span className="block font-medium text-sm">Operations</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-wireframe-border rounded-md hover:bg-wireframe-bg-alt cursor-pointer">
                  <input type="radio" name="role" className="w-4 h-4 text-primary" />
                  <div>
                    <span className="block font-medium text-sm">Accounts</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-wireframe-border rounded-md hover:bg-wireframe-bg-alt cursor-pointer">
                  <input type="radio" name="role" className="w-4 h-4 text-primary" />
                  <div>
                    <span className="block font-medium text-sm">Admin</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-wireframe-border pt-6 mt-2">
              <label className="text-sm font-medium">Password</label>
              <input type="password" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="Enter secure password" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirm Password</label>
              <input type="password" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="Confirm password" />
            </div>

          </div>
        </div>
        <div className="px-6 py-4 bg-wireframe-bg-alt/50 border-t border-wireframe-border flex justify-end gap-3">
          <Link
            to="/users"
            className="px-4 py-2 border border-wireframe-border rounded-md font-medium hover:bg-wireframe-bg-alt transition-colors"
          >
            Cancel
          </Link>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium">
            Save User
          </button>
        </div>
      </div>
    </div>
  );
}
