import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/leads/new")({
  component: CreateLead,
});

function CreateLead() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/leads" className="hover:text-foreground">Leads</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Create New Lead</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Lead</h1>
        </div>
        <div className="flex gap-3">
          <Link
            to="/leads"
            className="px-4 py-2 border border-wireframe-border rounded-md font-medium hover:bg-wireframe-bg-alt transition-colors"
          >
            Cancel
          </Link>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium">
            Save Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium">
            Basic Information
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Company Name</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="Enter company name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Contact Person</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Designation</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="e.g. Manager" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mobile</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="+91" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Alternate Mobile</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="+91" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Email Address</label>
                <input type="email" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="email@example.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium">
            Business Information
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">GST Number</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="22AAAAA0000A1Z5" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Industry Type</label>
                <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm">
                  <option value="">Select Industry</option>
                  <option value="farming">Farming</option>
                  <option value="distribution">Distribution</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Feed Type</label>
                <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm">
                  <option value="">Select Feed</option>
                  <option value="poultry">Poultry</option>
                  <option value="cattle">Cattle</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Monthly Consumption (MT)</label>
                <input type="number" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Estimated Quantity</label>
                <input type="number" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="0" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Product Interest</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="Specific products..." />
              </div>
            </div>
          </div>
        </div>

        {/* Address Form */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium">
            Address Details
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Address Line 1</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="Street address" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Address Line 2</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="Apartment, suite, unit, etc." />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">City</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="City" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">State</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="State" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Country</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" defaultValue="India" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Pincode</label>
                <input type="text" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" placeholder="000000" />
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Form */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium">
            Assignment & Status
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Lead Source</label>
                <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm">
                  <option value="">Select Source</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="exhibition">Exhibition</option>
                  <option value="cold_call">Cold Call</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Priority</label>
                <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Assigned Executive</label>
                <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm">
                  <option value="">Select Executive</option>
                  <option value="rohan">Rohan Kapoor</option>
                  <option value="amit">Amit Singh</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end gap-3">
        <Link
          to="/leads"
          className="px-4 py-2 border border-wireframe-border rounded-md font-medium hover:bg-wireframe-bg-alt transition-colors"
        >
          Cancel
        </Link>
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium">
          Save Lead
        </button>
      </div>
    </div>
  );
}
