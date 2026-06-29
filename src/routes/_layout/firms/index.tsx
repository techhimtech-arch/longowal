import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/firms/")({
  component: FirmsList,
});

interface FirmAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

interface BankDetails {
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
}

interface Firm {
  _id: string;
  firmName: string;
  gstNumber?: string;
  panNumber?: string;
  address?: FirmAddress;
  bankDetails?: BankDetails;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

function FirmsList() {
  const [search, setSearch] = useState("");

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["firms", search],
    queryFn: async () => {
      const res = await api.get("/firms");
      return res.data;
    },
  });

  const firmsList: Firm[] = response?.data || [];

  // Filter firms by name locally if search is active
  const filteredFirms = firmsList.filter((firm) =>
    firm.firmName.toLowerCase().includes(search.toLowerCase())
  );

  const formatAddress = (addr?: FirmAddress) => {
    if (!addr) return "-";
    const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "-";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Firm Management</h1>
          <p className="text-muted-foreground">Manage execution firms, address details, and billing settings.</p>
        </div>
        <div>
          <Link
            to="/firms/new"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add_business</span>
            Add New Firm
          </Link>
        </div>
      </div>

      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-wireframe-border flex flex-wrap gap-4 bg-wireframe-bg-alt/50">
          <input
            type="text"
            placeholder="Search firms by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-input bg-background rounded px-3 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground font-medium flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
              Loading firms...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600 font-medium">
              Error loading firms: {(error as any).message || "Unknown error"}
            </div>
          ) : filteredFirms.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">
              No firms found.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-wireframe-bg-alt border-b border-wireframe-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Firm Name</th>
                  <th className="px-6 py-3 font-medium">GST / PAN</th>
                  <th className="px-6 py-3 font-medium">Address</th>
                  <th className="px-6 py-3 font-medium">Bank Details</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFirms.map((firm) => {
                  const isFirmActive = firm.status === "ACTIVE";

                  return (
                    <tr key={firm._id} className="border-b border-wireframe-border hover:bg-wireframe-bg-alt/50">
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {firm.firmName}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="text-xs"><span className="font-semibold text-muted-foreground">GST:</span> {firm.gstNumber || "-"}</div>
                        <div className="text-xs"><span className="font-semibold text-muted-foreground">PAN:</span> {firm.panNumber || "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate" title={formatAddress(firm.address)}>
                        {formatAddress(firm.address)}
                      </td>
                      <td className="px-6 py-4 text-xs space-y-0.5">
                        {firm.bankDetails?.bankName ? (
                          <>
                            <div className="font-medium text-foreground">{firm.bankDetails.bankName}</div>
                            <div className="text-muted-foreground">A/C: {firm.bankDetails.accountNumber || "-"}</div>
                            <div className="text-muted-foreground">IFSC: {firm.bankDetails.ifscCode || "-"}</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isFirmActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isFirmActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/firms/$firmId/edit`}
                          params={{ firmId: firm._id }}
                          className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 text-xs bg-primary/10 px-2.5 py-1 rounded"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t border-wireframe-border flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing {filteredFirms.length} entries</div>
        </div>
      </div>
    </div>
  );
}
