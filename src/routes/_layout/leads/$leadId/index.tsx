import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/leads/$leadId/")({
  component: LeadDetail,
});

function LeadDetail() {
  const { leadId } = Route.useParams();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/leads" className="hover:text-foreground">Leads</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{leadId}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Acme Corp</h1>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Hot
            </span>
          </div>
          <p className="text-muted-foreground mt-1">Created on Oct 20, 2023</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/leads"
            className="px-4 py-2 border border-wireframe-border rounded-md font-medium hover:bg-wireframe-bg-alt transition-colors"
          >
            Back
          </Link>
          <Link
            to="/leads/$leadId/followup"
            params={{ leadId }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
          >
            Add Followup
          </Link>
          <button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md font-medium">
            Convert to Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-lg border-b border-wireframe-border pb-2">Business Details</h3>
            <div>
              <p className="text-sm text-muted-foreground">GST Number</p>
              <p className="font-medium">22AAAAA0000A1Z5</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Industry</p>
              <p className="font-medium">Farming</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Product Interest</p>
              <p className="font-medium">Poultry Feed (500 MT/month)</p>
            </div>
          </div>

          <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-lg border-b border-wireframe-border pb-2">Contact Details</h3>
            <div>
              <p className="text-sm text-muted-foreground">Contact Person</p>
              <p className="font-medium">John Doe (Manager)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mobile</p>
              <p className="font-medium">+91 9876543210</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">john@acmecorp.example.com</p>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Notes */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm">
            <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium flex justify-between items-center">
              <span>Timeline / History</span>
            </div>
            <div className="p-4">
              <div className="relative border-l border-wireframe-border ml-3 space-y-6 pb-4">
                
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 ring-4 ring-background"></div>
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Oct 25, 2023 - Meeting</span>
                    <h4 className="font-medium mt-1">Discussed bulk pricing</h4>
                    <p className="text-sm text-muted-foreground mt-1">Client requested a quotation for 500 MT of poultry feed.</p>
                  </div>
                </div>

                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-wireframe-border rounded-full -left-[6.5px] top-1.5 ring-4 ring-background"></div>
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Oct 22, 2023 - Call</span>
                    <h4 className="font-medium mt-1">Initial follow-up call</h4>
                    <p className="text-sm text-muted-foreground mt-1">Introduced our product line. Client showed interest.</p>
                  </div>
                </div>

                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-wireframe-border rounded-full -left-[6.5px] top-1.5 ring-4 ring-background"></div>
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Oct 20, 2023 - System</span>
                    <h4 className="font-medium mt-1">Lead Created</h4>
                    <p className="text-sm text-muted-foreground mt-1">Lead imported from website inquiry.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm">
            <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium">
              Notes & Attachments
            </div>
            <div className="p-4">
              <textarea 
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm mb-3 min-h-[100px]" 
                placeholder="Add an internal note..."
              ></textarea>
              <div className="flex justify-between items-center">
                <button className="text-sm text-primary flex items-center gap-1 hover:underline">
                  <span className="material-symbols-outlined text-[18px]">attach_file</span>
                  Attach File
                </button>
                <button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-3 py-1.5 rounded text-sm font-medium">
                  Save Note
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
