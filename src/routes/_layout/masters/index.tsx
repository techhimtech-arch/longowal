import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/masters/")({
  component: MastersDashboard,
});

interface MasterEntry {
  _id: string;
  category: 'STATE' | 'PLANT' | 'PRODUCT' | 'OTHER';
  key: string;
  value: any;
  isActive: boolean;
  remarks?: string;
  createdAt: string;
}

function MastersDashboard() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<'STATE' | 'PLANT' | 'PRODUCT' | 'OTHER'>('PRODUCT');
  const [search, setSearch] = useState("");

  // Modal Dialog states
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MasterEntry | null>(null);

  // Form states
  const [formKey, setFormKey] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  
  // Custom Value fields based on Category
  const [valName, setValName] = useState("");
  const [valUnit, setValUnit] = useState("tons");
  const [valGst, setValGst] = useState(18);
  const [valLocation, setValLocation] = useState("");

  // Fetch Master Data
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["masters", activeCategory],
    queryFn: async () => {
      const res = await api.get(`/masters?category=${activeCategory}&isActive=false`);
      return res.data;
    }
  });

  const mastersList: MasterEntry[] = response?.data || [];

  // Filter master entries locally by key or value name
  const filteredMasters = mastersList.filter((item) => {
    const keyMatch = item.key.toLowerCase().includes(search.toLowerCase());
    const nameMatch = (item.value?.name || (typeof item.value === "string" ? item.value : ""))
      .toLowerCase()
      .includes(search.toLowerCase());
    return keyMatch || nameMatch;
  });

  const resetForm = () => {
    setFormKey("");
    setFormRemarks("");
    setValName("");
    setValUnit("tons");
    setValGst(18);
    setValLocation("");
    setEditingEntry(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsOpenModal(true);
  };

  const openEditModal = (entry: MasterEntry) => {
    setEditingEntry(entry);
    setFormKey(entry.key);
    setFormRemarks(entry.remarks || "");
    if (entry.category === "PRODUCT") {
      setValName(entry.value?.name || "");
      setValUnit(entry.value?.defaultUnit || "tons");
      setValGst(entry.value?.defaultGstPercent || 0);
    } else if (entry.category === "PLANT") {
      setValName(entry.value?.name || "");
      setValLocation(entry.value?.location || "");
    } else {
      setValName(typeof entry.value === "string" ? entry.value : (entry.value?.name || ""));
    }
    setIsOpenModal(true);
  };

  // Create or Update Master Entry Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      let finalValue: any = valName;
      if (activeCategory === "PRODUCT") {
        finalValue = { name: valName, defaultUnit: valUnit, defaultGstPercent: valGst };
      } else if (activeCategory === "PLANT") {
        finalValue = { name: valName, location: valLocation };
      } else if (activeCategory === "STATE") {
        finalValue = { name: valName };
      }

      const payload = {
        category: activeCategory,
        key: formKey,
        value: finalValue,
        remarks: formRemarks
      };

      if (editingEntry) {
        const res = await api.put(`/masters/${editingEntry._id}`, payload);
        return res.data;
      } else {
        const res = await api.post("/masters", payload);
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success(editingEntry ? "Master entry updated successfully" : "Master entry created successfully");
      setIsOpenModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["masters", activeCategory] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to save entry");
    }
  });

  // Toggle Active Status Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.put(`/masters/${id}`, { isActive });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["masters", activeCategory] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle status");
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/masters/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Master entry deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["masters", activeCategory] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete entry");
    }
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Master Data Settings</h1>
          <p className="text-muted-foreground">Manage lookup data: States, Loading Plants, Products, and other metadata.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Add Master Entry
        </button>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-wireframe-border mb-6 flex gap-4 overflow-x-auto">
        {(['PRODUCT', 'PLANT', 'STATE', 'OTHER'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setSearch("");
            }}
            className={`px-5 py-2.5 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeCategory === cat
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat === "PRODUCT" ? "Products Catalog" :
             cat === "PLANT" ? "Loading Plants" :
             cat === "STATE" ? "States Lookup" : "Other Masters"}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-wireframe-border bg-wireframe-bg-alt/30 flex gap-4">
          <input
            type="text"
            placeholder={`Search by code or name...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-input bg-background rounded px-3 py-1.5 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground font-medium flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
              Loading entries...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600 font-medium">
              Error loading: {(error as any).message}
            </div>
          ) : filteredMasters.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border-t border-wireframe-border">
              No entries found. Click "Add Master Entry" to create one.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-wireframe-border text-xs text-muted-foreground uppercase font-bold bg-wireframe-bg-alt/30">
                  <th className="py-3 px-4">Code / Key</th>
                  <th className="py-3 px-4">Name</th>
                  {activeCategory === "PRODUCT" && (
                    <>
                      <th className="py-3 px-4">Default Unit</th>
                      <th className="py-3 px-4">Default GST %</th>
                    </>
                  )}
                  {activeCategory === "PLANT" && (
                    <th className="py-3 px-4">Location</th>
                  )}
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wireframe-border text-sm">
                {filteredMasters.map((entry) => {
                  const entryName = entry.value?.name || (typeof entry.value === "string" ? entry.value : "-");
                  return (
                    <tr key={entry._id} className="hover:bg-wireframe-bg-alt/10">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{entry.key}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{entryName}</td>
                      {activeCategory === "PRODUCT" && (
                        <>
                          <td className="py-3 px-4 text-muted-foreground">{entry.value?.defaultUnit || "-"}</td>
                          <td className="py-3 px-4 font-semibold text-foreground">{entry.value?.defaultGstPercent || 0}%</td>
                        </>
                      )}
                      {activeCategory === "PLANT" && (
                        <td className="py-3 px-4 text-muted-foreground">{entry.value?.location || "-"}</td>
                      )}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleActiveMutation.mutate({ id: entry._id, isActive: !entry.isActive })}
                          className={`px-2 py-0.5 rounded text-xs font-bold border transition-colors ${
                            entry.isActive 
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          {entry.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{entry.remarks || "-"}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="text-primary hover:underline font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this master entry?")) {
                              deleteMutation.mutate(entry._id);
                            }
                          }}
                          className="text-red-600 hover:underline font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Master Entry Modal Overlay */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-wireframe-border shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <h3 className="font-semibold text-lg mb-2 text-foreground">
              {editingEntry ? "Edit Master Entry" : "Add Master Entry"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Category: <span className="font-bold text-primary">{activeCategory}</span>. Keys must be unique.
            </p>

            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Unique Key / Code *</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase font-mono"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  placeholder="e.g. PB or CEMENT-53"
                  disabled={!!editingEntry}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name / Title *</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={valName}
                  onChange={(e) => setValName(e.target.value)}
                  placeholder="e.g. Punjab or Grade 53 Cement"
                />
              </div>

              {activeCategory === "PRODUCT" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Default Unit</label>
                    <select
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={valUnit}
                      onChange={(e) => setValUnit(e.target.value)}
                    >
                      <option value="tons">tons</option>
                      <option value="kg">kg</option>
                      <option value="bags">bags</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Default GST %</label>
                    <input
                      type="number"
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={valGst}
                      onChange={(e) => setValGst(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {activeCategory === "PLANT" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Plant Location</label>
                  <input
                    type="text"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={valLocation}
                    onChange={(e) => setValLocation(e.target.value)}
                    placeholder="e.g. Sangrur, Punjab"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Remarks / Description</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Additional lookup notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-wireframe-border pt-4">
              <button
                onClick={() => setIsOpenModal(false)}
                className="px-4 py-2 border border-wireframe-border rounded-md text-sm font-medium hover:bg-wireframe-bg-alt"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !formKey.trim() || !valName.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
                type="button"
              >
                {saveMutation.isPending ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
