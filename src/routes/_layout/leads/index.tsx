import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_layout/leads/")({
  component: LeadsList,
});

const mockLeads = [
  {
    id: "LD-001",
    companyName: "Acme Corp",
    contactPerson: "John Doe",
    mobile: "+91 9876543210",
    state: "Maharashtra",
    productInterest: "Poultry Feed",
    status: "Hot",
    assignedExecutive: "Rohan Kapoor",
    lastFollowup: "2023-10-25",
    nextFollowup: "2023-10-28",
  },
  {
    id: "LD-002",
    companyName: "Global Foods",
    contactPerson: "Jane Smith",
    mobile: "+91 8765432109",
    state: "Gujarat",
    productInterest: "Cattle Feed",
    status: "Warm",
    assignedExecutive: "Amit Singh",
    lastFollowup: "2023-10-20",
    nextFollowup: "2023-10-26",
  },
];

function LeadsList() {
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
            className="border border-input bg-background rounded px-3 py-2 text-sm w-64"
          />
          <select className="border border-input bg-background rounded px-3 py-2 text-sm">
            <option value="">All States</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Gujarat">Gujarat</option>
          </select>
          <select className="border border-input bg-background rounded px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>
        </div>

        <div className="overflow-x-auto">
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
              {mockLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-wireframe-border hover:bg-wireframe-bg-alt/50">
                  <td className="px-6 py-4 font-medium">{lead.id}</td>
                  <td className="px-6 py-4">{lead.companyName}</td>
                  <td className="px-6 py-4">
                    <div>{lead.contactPerson}</div>
                    <div className="text-xs text-muted-foreground">{lead.mobile}</div>
                  </td>
                  <td className="px-6 py-4">{lead.state}</td>
                  <td className="px-6 py-4">{lead.productInterest}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lead.status === 'Hot' ? 'bg-red-100 text-red-800' : 
                      lead.status === 'Warm' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{lead.assignedExecutive}</td>
                  <td className="px-6 py-4">{lead.nextFollowup}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-muted-foreground hover:text-foreground" title="View">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button className="p-1 text-muted-foreground hover:text-foreground" title="Edit">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button className="p-1 text-muted-foreground hover:text-foreground" title="Add Followup">
                        <span className="material-symbols-outlined text-[18px]">phone_callback</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-wireframe-border flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing 1 to 2 of 2 entries</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-wireframe-border rounded hover:bg-wireframe-bg-alt disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 border border-wireframe-border rounded bg-primary text-primary-foreground">1</button>
            <button className="px-3 py-1 border border-wireframe-border rounded hover:bg-wireframe-bg-alt disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
