import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/leads/$leadId/followup")({
  component: AddFollowup,
});

function AddFollowup() {
  const { leadId } = Route.useParams();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/leads" className="hover:text-foreground">Leads</Link>
            <span>/</span>
            <Link to={`/leads/${leadId}`} className="hover:text-foreground">{leadId}</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Add Followup</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Add Followup</h1>
        </div>
      </div>

      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Followup Date</label>
              <input type="date" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Followup Type</label>
              <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm">
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-medium">Outcome</label>
              <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm">
                <option value="">Select Outcome</option>
                <option value="interested">Interested</option>
                <option value="not_interested">Not Interested</option>
                <option value="call_back">Call Back Later</option>
                <option value="quotation_requested">Quotation Requested</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea 
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm min-h-[120px]" 
                placeholder="Enter details of the conversation..."
              ></textarea>
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Next Followup Date</label>
              <input type="date" className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-wireframe-bg-alt/50 border-t border-wireframe-border flex justify-end gap-3">
          <Link
            to={`/leads/${leadId}`}
            className="px-4 py-2 border border-wireframe-border rounded-md font-medium hover:bg-wireframe-bg-alt transition-colors"
          >
            Cancel
          </Link>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium">
            Save Followup
          </button>
        </div>
      </div>
    </div>
  );
}
