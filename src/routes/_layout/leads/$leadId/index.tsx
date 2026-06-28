import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/leads/$leadId/")({
  component: LeadDetail,
});

function LeadDetail() {
  const { leadId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Fetch lead details
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      const res = await api.get(`/leads/${leadId}`);
      return res.data;
    },
  });

  const lead = response?.data;

  // Save note mutation (adds a followup of type Call)
  const saveNoteMutation = useMutation({
    mutationFn: async (notes: string) => {
      const res = await api.post(`/leads/${leadId}/followups`, {
        date: new Date().toISOString(),
        type: "Call",
        outcome: "Logged Note",
        notes,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Note saved successfully");
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
    },
    onError: (err: any) => {
      console.error(err);
    },
  });

  // Convert to Customer mutation
  const convertMutation = useMutation({
    mutationFn: async () => {
      // 1. Create the customer in backend
      const customerPayload = {
        companyName: lead.companyName,
        gstNumber: lead.gstNumber,
        primaryContact: {
          name: lead.contactPerson,
          mobile: lead.mobile,
          email: lead.email,
        },
        billingAddress: lead.address,
        shippingAddress: lead.address,
        customerCategory: lead.feedType || "Direct Customer",
        status: "ACTIVE",
      };

      await api.post("/customers", customerPayload);

      // 2. Update lead status in backend
      await api.put(`/leads/${leadId}`, {
        isConverted: true,
        status: "Converted",
      });
    },
    onSuccess: () => {
      toast.success("Lead converted to customer successfully!");
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: any) => {
      console.error(err);
    },
  });

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    saveNoteMutation.mutate(noteText);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wireframe-bg-alt text-muted-foreground gap-2">
        <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
        Loading details...
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6 text-center text-red-600 font-medium">
        Error loading lead details: {(error as any)?.message || "Lead not found."}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/leads" className="hover:text-foreground">Leads</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{leadId.substring(leadId.length - 8)}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{lead.companyName}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
              lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
              lead.status === 'Qualified' ? 'bg-green-100 text-green-800' :
              lead.status === 'Converted' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {lead.status}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">Created on {new Date(lead.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/leads"
            className="px-4 py-2 border border-wireframe-border rounded-md font-medium hover:bg-wireframe-bg-alt transition-colors"
          >
            Back
          </Link>
          {!lead.isConverted && (
            <>
              <Link
                to="/leads/$leadId/followup"
                params={{ leadId }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
              >
                Add Followup
              </Link>
              <button
                onClick={() => convertMutation.mutate()}
                disabled={convertMutation.isPending}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-75"
              >
                {convertMutation.isPending ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                    Converting...
                  </>
                ) : "Convert to Customer"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-lg border-b border-wireframe-border pb-2">Business Details</h3>
            <div>
              <p className="text-sm text-muted-foreground">GST Number</p>
              <p className="font-medium">{lead.gstNumber || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Industry</p>
              <p className="font-medium">{lead.industryType || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Product Interest</p>
              <p className="font-medium">
                {Array.isArray(lead.productInterest) ? lead.productInterest.join(", ") : lead.productInterest || "-"}
                {lead.estimatedQuantity ? ` (${lead.estimatedQuantity} MT estimated)` : ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Feed Type</p>
              <p className="font-medium">{lead.feedType || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Consumption</p>
              <p className="font-medium">{lead.monthlyConsumption ? `${lead.monthlyConsumption} MT` : "-"}</p>
            </div>
          </div>

          <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-lg border-b border-wireframe-border pb-2">Contact Details</h3>
            <div>
              <p className="text-sm text-muted-foreground">Contact Person</p>
              <p className="font-medium">{lead.contactPerson} {lead.designation ? `(${lead.designation})` : ""}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mobile</p>
              <p className="font-medium">{lead.mobile}</p>
            </div>
            {lead.alternateMobile && (
              <div>
                <p className="text-sm text-muted-foreground">Alternate Mobile</p>
                <p className="font-medium">{lead.alternateMobile}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{lead.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium text-sm">
                {[
                  lead.address?.line1,
                  lead.address?.line2,
                  lead.address?.city,
                  lead.address?.state,
                  lead.address?.pincode,
                ].filter(Boolean).join(", ")}
              </p>
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
              {(!lead.followups || lead.followups.length === 0) ? (
                <div className="p-6 text-center text-muted-foreground">
                  No followup history available.
                </div>
              ) : (
                <div className="relative border-l border-wireframe-border ml-3 space-y-6 pb-4">
                  {lead.followups.slice().reverse().map((followup: any, idx: number) => (
                    <div key={followup._id || idx} className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 ring-4 ring-background"></div>
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {new Date(followup.date).toLocaleDateString()} - {followup.type} ({followup.outcome || "No outcome"})
                        </span>
                        {followup.notes && <p className="text-sm text-foreground mt-1 bg-wireframe-bg-alt/40 p-2 rounded">{followup.notes}</p>}
                        {followup.nextFollowupDate && (
                          <p className="text-xs text-secondary mt-1 flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            Next followup planned: {new Date(followup.nextFollowupDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!lead.isConverted && (
            <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm">
              <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium">
                Add Note
              </div>
              <div className="p-4">
                <textarea
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm mb-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Add an internal note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                ></textarea>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNote}
                    disabled={saveNoteMutation.isPending || !noteText.trim()}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2 disabled:opacity-70"
                  >
                    {saveNoteMutation.isPending ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
