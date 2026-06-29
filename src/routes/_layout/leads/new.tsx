import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/leads/new")({
  component: CreateLead,
});

const leadSchema = z.object({
  companyName: z.string().min(1, "Company Name is required"),
  contactPerson: z.string().min(1, "Contact Person is required"),
  designation: z.string().optional(),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  alternateMobile: z.string().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")),
  gstNumber: z.string().optional(),
  industryType: z.string().optional(),
  feedType: z.string().optional(),
  monthlyConsumption: z.coerce.number().optional(),
  estimatedQuantity: z.coerce.number().optional(),
  productInterest: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default("India"),
    pincode: z.string().optional(),
  }),
  leadSource: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  assignedExecutiveId: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

function CreateLead() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const normalizedRole = (user?.role || "").toLowerCase().replace(/[\s_-]/g, "");
  const isAdmin = normalizedRole === "superadmin" || normalizedRole === "admin";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      designation: "",
      mobile: "",
      alternateMobile: "",
      email: "",
      gstNumber: "",
      industryType: "",
      feedType: "",
      monthlyConsumption: undefined,
      estimatedQuantity: undefined,
      productInterest: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
      },
      leadSource: "",
      priority: "Medium",
      assignedExecutiveId: user?.id || "",
    },
  });

  // Query users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      if (!isAdmin) return [];
      try {
        const res = await api.get("/users");
        return res.data?.data || [];
      } catch (e) {
        console.warn("Failed to fetch users:", e);
        return [];
      }
    },
    enabled: isAdmin,
  });

  // Create lead mutation
  const createMutation = useMutation({
    mutationFn: async (values: LeadFormValues) => {
      // Map productInterest string to array if provided
      const payload = {
        ...values,
        productInterest: values.productInterest 
          ? values.productInterest.split(",").map(p => p.trim())
          : [],
      };
      const res = await api.post("/leads", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      navigate({ to: "/leads" });
    },
    onError: (error: any) => {
      console.error(error);
      setErrorMsg(error.response?.data?.message || "Failed to create lead. Please try again.");
    },
  });

  const onSubmit = (data: LeadFormValues) => {
    setErrorMsg(null);
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 max-w-5xl mx-auto">
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                Saving...
              </>
            ) : "Save Lead"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 font-medium text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium">
            Basic Information
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Company Name *</label>
                <input
                  type="text"
                  {...register("companyName")}
                  className={`w-full border ${errors.companyName ? 'border-red-500 focus:ring-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                  placeholder="Enter company name"
                />
                {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Contact Person *</label>
                <input
                  type="text"
                  {...register("contactPerson")}
                  className={`w-full border ${errors.contactPerson ? 'border-red-500 focus:ring-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                  placeholder="Full name"
                />
                {errors.contactPerson && <p className="text-red-500 text-xs">{errors.contactPerson.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Designation</label>
                <input
                  type="text"
                  {...register("designation")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="e.g. Purchase Manager"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mobile *</label>
                <input
                  type="text"
                  {...register("mobile")}
                  className={`w-full border ${errors.mobile ? 'border-red-500 focus:ring-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                  placeholder="e.g. 9876543210"
                />
                {errors.mobile && <p className="text-red-500 text-xs">{errors.mobile.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Alternate Mobile</label>
                <input
                  type="text"
                  {...register("alternateMobile")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="e.g. 9812345678"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Email Address</label>
                <input
                  type="text"
                  {...register("email")}
                  className={`w-full border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                  placeholder="email@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
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
                <input
                  type="text"
                  {...register("gstNumber")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="02AAACH1234Z1ZA"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Industry Type</label>
                <input
                  type="text"
                  {...register("industryType")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="e.g. Construction"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Feed Type</label>
                <input
                  type="text"
                  {...register("feedType")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="e.g. Bulk"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Monthly Consumption (Tons)</label>
                <input
                  type="number"
                  {...register("monthlyConsumption")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Estimated Quantity (Tons)</label>
                <input
                  type="number"
                  {...register("estimatedQuantity")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Product Interest (comma separated)</label>
                <input
                  type="text"
                  {...register("productInterest")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="e.g. Portland Cement, Flyash Cement"
                />
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
                <input
                  type="text"
                  {...register("address.line1")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="Street address"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Address Line 2</label>
                <input
                  type="text"
                  {...register("address.line2")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="Apartment, suite, unit, etc."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">City</label>
                <input
                  type="text"
                  {...register("address.city")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="City"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">State</label>
                <input
                  type="text"
                  {...register("address.state")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="State"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Country</label>
                <input
                  type="text"
                  {...register("address.country")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Pincode</label>
                <input
                  type="text"
                  {...register("address.pincode")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="148001"
                />
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
                <select
                  {...register("leadSource")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                >
                  <option value="">Select Source</option>
                  <option value="Direct Referral">Direct Referral</option>
                  <option value="Website">Website</option>
                  <option value="Exhibition">Exhibition</option>
                  <option value="Cold Call">Cold Call</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Priority</label>
                <select
                  {...register("priority")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {isAdmin && (
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium">Assigned Executive</label>
                  <select
                    {...register("assignedExecutiveId")}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="">Select Executive</option>
                    {users.map((u: any) => (
                      <option key={u._id} value={u._id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              Saving...
            </>
          ) : "Save Lead"}
        </button>
      </div>
    </form>
  );
}
