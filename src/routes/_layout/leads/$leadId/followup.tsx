import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/leads/$leadId/followup")({
  component: AddFollowup,
});

const followupSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(["Call", "Meeting", "Email"]),
  outcome: z.string().min(1, "Outcome description is required"),
  notes: z.string().optional(),
  nextFollowupDate: z.string().optional(),
  status: z.string().optional(), // Optional Lead Status update
});

type FollowupFormValues = z.infer<typeof followupSchema>;

function AddFollowup() {
  const { leadId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FollowupFormValues>({
    resolver: zodResolver(followupSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "Call",
      outcome: "",
      notes: "",
      nextFollowupDate: "",
      status: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FollowupFormValues) => {
      // Map empty strings for dates to undefined so backend doesn't complain about invalid formats
      const payload = {
        ...values,
        date: new Date(values.date).toISOString(),
        nextFollowupDate: values.nextFollowupDate ? new Date(values.nextFollowupDate).toISOString() : undefined,
        status: values.status || undefined,
      };
      const res = await api.post(`/leads/${leadId}/followups`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Followup added successfully!");
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      navigate({ to: "/leads/$leadId", params: { leadId } });
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to add followup. Please try again.");
    },
  });

  const onSubmit = (data: FollowupFormValues) => {
    setErrorMsg(null);
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/leads" className="hover:text-foreground">Leads</Link>
            <span>/</span>
            <Link to="/leads/$leadId" params={{ leadId }} className="hover:text-foreground">
              {leadId.substring(leadId.length - 8)}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Add Followup</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Add Followup</h1>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 font-medium text-sm">
          {errorMsg}
        </div>
      )}

      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Followup Date *</label>
              <input
                type="date"
                {...register("date")}
                className={`w-full border ${errors.date ? 'border-red-500 focus:ring-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2`}
              />
              {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Followup Type *</label>
              <select
                {...register("type")}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Call">Call</option>
                <option value="Meeting">Meeting</option>
                <option value="Email">Email</option>
              </select>
              {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-medium">Outcome / Summary *</label>
              <input
                type="text"
                {...register("outcome")}
                className={`w-full border ${errors.outcome ? 'border-red-500 focus:ring-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                placeholder="e.g. Interested, asked to call back next week"
              />
              {errors.outcome && <p className="text-red-500 text-xs">{errors.outcome.message}</p>}
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-medium">Detailed Notes</label>
              <textarea
                {...register("notes")}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter details of the conversation..."
              ></textarea>
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Next Followup Date</label>
              <input
                type="date"
                {...register("nextFollowupDate")}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Update Lead Status (Optional)</label>
              <select
                {...register("status")}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Keep current status</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-wireframe-bg-alt/50 border-t border-wireframe-border flex justify-end gap-3">
          <Link
            to="/leads/$leadId"
            params={{ leadId }}
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
            ) : "Save Followup"}
          </button>
        </div>
      </div>
    </form>
  );
}
