import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

export const Route = createFileRoute("/_layout/users/new")({
  component: CreateUser,
});

const userSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  mobile: z.string().min(10, { message: "Mobile number must be at least 10 digits" }),
  role: z.enum(["Admin", "Sales Executive", "Operations", "Accounts", "Logistics"], {
    required_error: "Please select a role",
  }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .refine((val) => /[A-Z]/.test(val), { message: "Must contain at least one uppercase letter" })
    .refine((val) => /[a-z]/.test(val), { message: "Must contain at least one lowercase letter" })
    .refine((val) => /[0-9]/.test(val), { message: "Must contain at least one number" })
    .refine((val) => /[^A-Za-z0-9]/.test(val), { message: "Must contain at least one special character" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserFormValues = z.infer<typeof userSchema>;

function mapRoleToUserType(role: string): string {
  if (role === "Admin") return "SUPER_ADMIN";
  if (role === "Sales Executive") return "ORG_ADMIN";
  if (role === "Operations") return "VOLUNTEER";
  if (role === "Accounts") return "CITIZEN";
  if (role === "Logistics") return "LOGISTICS_TEAM";
  return "ORG_ADMIN";
}

function CreateUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      role: "Sales Executive",
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      // Split full name into first and last name
      const nameParts = values.fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "."; // Fallback to dot if only one name

      // Normalize phone number (strip whitespace or dashes to keep it numeric)
      const cleanPhone = values.mobile.replace(/\s+/g, "").replace(/-/g, "");

      const payload = {
        firstName,
        lastName,
        email: values.email,
        password: values.password,
        userType: mapRoleToUserType(values.role),
        phoneNumber: cleanPhone.startsWith("+") ? cleanPhone : `+91${cleanPhone}`, // Ensure valid phone format
        status: "ACTIVE"
      };

      const res = await api.post("/users", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("User created successfully!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate({ to: "/users" });
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to create user. Please check your data.");
    }
  });

  const onSubmit = (data: UserFormValues) => {
    setErrorMsg(null);
    mutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/users" className="hover:text-foreground">Users</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Create New User</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New User</h1>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 font-medium text-sm">
          {errorMsg}
        </div>
      )}

      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <input
                  type="text"
                  className={`w-full border ${errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                  placeholder="e.g. John Doe"
                  {...register("fullName")}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email Address *</label>
                <input
                  type="email"
                  className={`w-full border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                  placeholder="john@example.com"
                  {...register("email")}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Mobile Number (e.g. 9876543210) *</label>
                <input
                  type="text"
                  className={`w-full border ${errors.mobile ? 'border-red-500 focus:ring-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                  placeholder="9876543210"
                  {...register("mobile")}
                />
                {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
              </div>

              <div className="space-y-1.5 border-t border-wireframe-border pt-6 mt-2">
                <label className="text-sm font-medium text-foreground">Assign Role *</label>
                <p className="text-xs text-muted-foreground mb-3">Select the appropriate role to grant the user specific system permissions.</p>
                <div className="grid grid-cols-2 gap-3">
                  {["Sales Executive", "Operations", "Accounts", "Admin", "Logistics"].map((roleOption) => (
                    <label key={roleOption} className="flex items-center gap-3 p-3 border border-wireframe-border rounded-md hover:bg-wireframe-bg-alt cursor-pointer">
                      <input
                        type="radio"
                        value={roleOption}
                        className="w-4 h-4 text-primary"
                        {...register("role")}
                      />
                      <div>
                        <span className="block font-medium text-sm">{roleOption}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
              </div>

              <div className="space-y-1.5 border-t border-wireframe-border pt-6 mt-2">
                <label className="text-sm font-medium text-foreground">Password *</label>
                <p className="text-xs text-muted-foreground mb-2">Must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.</p>
                <input
                  type="password"
                  className={`w-full border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                  placeholder="Enter secure password"
                  {...register("password")}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Confirm Password *</label>
                <input
                  type="password"
                  className={`w-full border ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                  placeholder="Confirm password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

            </div>
          </div>
          <div className="px-6 py-4 bg-wireframe-bg-alt/50 border-t border-wireframe-border flex justify-end gap-3">
            <Link
              to="/users"
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
              ) : "Save User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
