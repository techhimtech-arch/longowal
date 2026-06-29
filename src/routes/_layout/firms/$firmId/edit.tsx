import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/firms/$firmId/edit")({
  component: EditFirm,
});

const firmSchema = z.object({
  firmName: z.string().min(2, { message: "Firm name must be at least 2 characters" }),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default("India"),
    pincode: z.string().optional(),
  }),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    branch: z.string().optional(),
  }),
});

type FirmFormValues = z.infer<typeof firmSchema>;

function EditFirm() {
  const { firmId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch existing firm details
  const { data: response, isLoading: isFetching, error: fetchError } = useQuery({
    queryKey: ["firm", firmId],
    queryFn: async () => {
      const res = await api.get(`/firms/${firmId}`);
      return res.data;
    },
  });

  const firm = response?.data;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FirmFormValues>({
    resolver: zodResolver(firmSchema),
  });

  // Populate form with existing data when fetched
  useEffect(() => {
    if (firm) {
      reset({
        firmName: firm.firmName || "",
        gstNumber: firm.gstNumber || "",
        panNumber: firm.panNumber || "",
        address: {
          line1: firm.address?.line1 || "",
          line2: firm.address?.line2 || "",
          city: firm.address?.city || "",
          state: firm.address?.state || "",
          country: firm.address?.country || "India",
          pincode: firm.address?.pincode || "",
        },
        bankDetails: {
          bankName: firm.bankDetails?.bankName || "",
          accountNumber: firm.bankDetails?.accountNumber || "",
          ifscCode: firm.bankDetails?.ifscCode || "",
          branch: firm.bankDetails?.branch || "",
        },
      });
    }
  }, [firm, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FirmFormValues) => {
      const res = await api.put(`/firms/${firmId}`, values);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Firm details updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["firms"] });
      queryClient.invalidateQueries({ queryKey: ["firm", firmId] });
      navigate({ to: "/firms" });
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to update firm. Please check input data.");
    },
  });

  const onSubmit = (data: FirmFormValues) => {
    setErrorMsg(null);
    mutation.mutate(data);
  };

  if (isFetching) {
    return (
      <div className="p-12 text-center text-muted-foreground font-medium flex items-center justify-center gap-2">
        <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
        Loading firm details...
      </div>
    );
  }

  if (fetchError || !firm) {
    return (
      <div className="p-12 text-center text-red-600 font-medium">
        Error loading firm details or firm not found.
        <div className="mt-4">
          <Link to="/firms" className="text-primary hover:underline text-sm font-semibold">Back to Firms</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/firms" className="hover:text-foreground">Firms</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Edit Firm Details</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Firm Details</h1>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 font-medium text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Firm Profile */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium text-primary">
            Section 1: Firm Details
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-sm font-medium text-foreground">Firm Name *</label>
                <input
                  type="text"
                  className={`w-full border ${errors.firmName ? 'border-red-500 focus:ring-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
                  placeholder="e.g. Longowal Organics Pvt Ltd"
                  {...register("firmName")}
                />
                {errors.firmName && <p className="text-red-500 text-xs mt-1">{errors.firmName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">GST Number</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 07AAAAA1111A1Z1"
                  {...register("gstNumber")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">PAN Number</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. ABCDE1234F"
                  {...register("panNumber")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Address */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium text-primary">
            Section 2: Address Details
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Address Line 1</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Street address, P.O. box"
                  {...register("address.line1")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Address Line 2</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  {...register("address.line2")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">City</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Ludhiana"
                  {...register("address.city")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">State</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Punjab"
                  {...register("address.state")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Pincode</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 141001"
                  {...register("address.pincode")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Country</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="India"
                  {...register("address.country")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Bank Details */}
        <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-wireframe-bg-alt/50 border-b border-wireframe-border font-medium text-primary">
            Section 3: Bank Details
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Bank Name</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. State Bank of India"
                  {...register("bankDetails.bankName")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Account Number</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 12345678901"
                  {...register("bankDetails.accountNumber")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">IFSC Code</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. SBIN0001234"
                  {...register("bankDetails.ifscCode")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Branch</label>
                <input
                  type="text"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Main Branch Ludhiana"
                  {...register("bankDetails.branch")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/firms"
            className="px-4 py-2 border border-wireframe-border rounded-md font-medium hover:bg-wireframe-bg-alt transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center gap-2 shadow disabled:opacity-75"
          >
            {mutation.isPending ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                Saving...
              </>
            ) : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
