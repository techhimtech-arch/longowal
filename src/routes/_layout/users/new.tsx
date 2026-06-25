import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const Route = createFileRoute("/_layout/users/new")({
  component: CreateUser,
});

const userSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  mobile: z.string().min(10, { message: "Mobile number must be at least 10 digits" }),
  role: z.enum(["Admin", "Sales Executive", "Operations", "Accounts"], {
    required_error: "Please select a role",
  }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserFormValues = z.infer<typeof userSchema>;

function CreateUser() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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

  const onSubmit = async (data: UserFormValues) => {
    // In a real app, send data to backend here
    console.log("New User Data:", data);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Redirect back to user list after successful creation
    navigate({ to: "/users" });
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

      <div className="bg-surface border border-wireframe-border rounded-lg shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input 
                  type="text" 
                  className={`w-full border ${errors.fullName ? 'border-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} 
                  placeholder="e.g. John Doe"
                  {...register("fullName")}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input 
                  type="email" 
                  className={`w-full border ${errors.email ? 'border-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} 
                  placeholder="john@example.com"
                  {...register("email")}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Mobile Number</label>
                <input 
                  type="text" 
                  className={`w-full border ${errors.mobile ? 'border-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} 
                  placeholder="+91 00000 00000"
                  {...register("mobile")}
                />
                {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
              </div>

              <div className="space-y-1.5 border-t border-wireframe-border pt-6 mt-2">
                <label className="text-sm font-medium text-foreground">Assign Role</label>
                <p className="text-xs text-muted-foreground mb-3">Select the appropriate role to grant the user specific system permissions.</p>
                <div className="grid grid-cols-2 gap-3">
                  {["Sales Executive", "Operations", "Accounts", "Admin"].map((roleOption) => (
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
                <label className="text-sm font-medium text-foreground">Password</label>
                <input 
                  type="password" 
                  className={`w-full border ${errors.password ? 'border-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} 
                  placeholder="Enter secure password"
                  {...register("password")}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <input 
                  type="password" 
                  className={`w-full border ${errors.confirmPassword ? 'border-red-500' : 'border-input'} bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} 
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
              className="px-4 py-2 border border-wireframe-border rounded-md font-medium hover:bg-wireframe-bg-alt transition-colors text-foreground"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
