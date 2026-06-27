import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/leads/")({
  component: LeadsList,
});

function LeadsList() {
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const navigate = useNavigate();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["leads", selectedState, selectedStatus],
    queryFn: async () => {
      const params: any = {};
      if (selectedState) params.state = selectedState;
      if (selectedStatus) params.status = selectedStatus;
      const res = await api.get("/leads", { params });
      return res.data;
    },
  });

  const leads = response?.data || [];

  // Client-side text search filter
  const filteredLeads = leads.filter((lead: any) => {
    const searchLower = search.toLowerCase();
    return (
      (lead.companyName || "").toLowerCase().includes(searchLower) ||
      (lead.contactPerson || "").toLowerCase().includes(searchLower) ||
      (lead.mobile || "").toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Leads</h1>
          <p className="text-muted-foreground">Manage and track your prospective customers.</p>
        </div>
        <Link
          to="/leads/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Lead
        </Link>
      </div>

      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-wireframe-border flex flex-wrap gap-4 bg-wireframe-bg-alt/50">
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-input bg-background rounded px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select 
            value={selectedState} 
            onChange={(e) => setSelectedState(e.target.value)}
            className="border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All States</option>
            <option value="Punjab">Punjab</option>
            <option value="Haryana">Haryana</option>
            <option value="Delhi">Delhi</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Gujarat">Gujarat</option>
          </select>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground font-medium flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
              Loading leads...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600 font-medium">
              Error loading leads: {(error as any).message || "Unknown error"}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">
              No leads found.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt border-b border-wireframe-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Lead ID</th>
                  <th className="px-6 py-3 font-medium">Company</th>
                  <th className="px-6 py-3 font-medium">Contact</th>
                  <th className="px-6 py-3 font-medium">State</th>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Executive</th>
                  <th className="px-6 py-3 font-medium">Next Followup</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead: any) => {
                  const latestFollowup = lead.followups?.[lead.followups.length - 1];
                  const nextFollowupDate = latestFollowup?.nextFollowupDate
                    ? new Date(latestFollowup.nextFollowupDate).toLocaleDateString()
                    : "-";
                  const leadIdShort = lead._id.substring(lead._id.length - 8);

                  return (
                    <tr key={lead._id} className="border-b border-wireframe-border hover:bg-wireframe-bg-alt/50">
                      <td className="px-6 py-4 font-medium">LD-{leadIdShort}</td>
                      <td className="px-6 py-4">{lead.companyName}</td>
                      <td className="px-6 py-4">
                        <div>{lead.contactPerson}</div>
                        <div className="text-xs text-muted-foreground">{lead.mobile}</div>
                      </td>
                      <td className="px-6 py-4">{lead.address?.state || "-"}</td>
                      <td className="px-6 py-4">
                        {Array.isArray(lead.productInterest)
                          ? lead.productInterest.join(", ")
                          : lead.productInterest || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'Qualified' ? 'bg-green-100 text-green-800' :
                          lead.status === 'Converted' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {lead.assignedExecutiveId
                          ? `${lead.assignedExecutiveId.firstName} ${lead.assignedExecutiveId.lastName}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4">{nextFollowupDate}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title="View Details"
                            onClick={() => navigate({ to: "/leads/$leadId", params: { leadId: lead._id } })}
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title="Add Followup"
                            onClick={() => navigate({ to: "/leads/$leadId/followup", params: { leadId: lead._id } })}
                          >
                            <span className="material-symbols-outlined text-[18px]">phone_callback</span>
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
          <div>Showing {filteredLeads.length} entries</div>
        </div>
      </div>
    </div>
  );
}
