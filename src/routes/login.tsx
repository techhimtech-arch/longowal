import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Longowal OOMS - Login" },
      { name: "description", content: "Login to Longowal Enterprise OOMS" },
    ],
  }),
  component: Login,
});

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    try {
      await login(data.email, data.password);
      navigate({ to: "/", replace: true });
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Invalid email or password. Please try again.";
      setErrorMsg(msg);
    }
  };

  if (isLoading) return null;

  return (
    <div className="bg-wireframe-bg-alt flex items-center justify-center min-h-screen">
      <div className="w-full max-w-[440px] px-margin-sm animate-in fade-in duration-700">
        
        <div className="text-center mb-margin-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-white border border-wireframe-border shadow-sm mb-4">
            <span className="material-symbols-outlined text-primary text-[40px]" data-icon="local_shipping">local_shipping</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-background tracking-tight">Longowal</h1>
          <p className="font-label-md text-label-md text-secondary tracking-widest uppercase mt-1">Enterprise OOMS</p>
        </div>

        <div className="bg-white border border-wireframe-border rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-margin-lg">
            <div className="mb-margin-md">
              <h2 className="font-headline-sm text-headline-sm text-on-background mb-1">Welcome Back</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Log in to manage your logistics pipeline.</p>
            </div>

            <form className="space-y-gutter" onSubmit={handleSubmit(onSubmit)}>
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                  {errorMsg}
                </div>
              )}

              {/* Email / Username */}
              <div className="space-y-1 group/input">
                <label className="block font-label-md text-label-md text-on-surface group-focus-within/input:text-primary transition-colors" htmlFor="email">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">person</span>
                  <input 
                    className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-wireframe-border focus:ring-primary focus:border-primary'} rounded font-body-md text-body-md focus:outline-none focus:ring-2 transition-all bg-surface-bright`} 
                    id="email" 
                    placeholder="Enter your email (e.g. admin@test.com)" 
                    type="email"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1 group/input">
                <div className="flex justify-between items-center">
                  <label className="block font-label-md text-label-md text-on-surface group-focus-within/input:text-primary transition-colors" htmlFor="password">Password</label>
                  <a className="font-label-md text-label-md text-primary hover:underline transition-all" href="#">Forgot Password?</a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                  <input 
                    className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-wireframe-border focus:ring-primary focus:border-primary'} rounded font-body-md text-body-md focus:outline-none focus:ring-2 transition-all bg-surface-bright`} 
                    id="password" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors" onClick={togglePassword} type="button">
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me & Reset Link Cluster */}
              <div className="flex items-center justify-between py-2">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input className="peer sr-only" type="checkbox" {...register("rememberMe")} />
                    <div className="w-5 h-5 border-2 border-wireframe-border rounded bg-white peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px] text-white hidden peer-checked:block">check</span>
                    </div>
                  </div>
                  <span className="ml-2 font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Remember Me</span>
                </label>
              </div>

              {/* Action: Login */}
              <button 
                className="w-full bg-primary text-white font-label-md text-label-md py-4 rounded-lg shadow-sm hover:bg-on-primary-fixed-variant active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "LOGGING IN..." : "LOGIN"}
                {!isSubmitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
            </form>
          </div>

          <div className="bg-wireframe-bg-alt border-t border-wireframe-border p-margin-md text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Having trouble logging in? <br/>
              <a className="font-label-md text-label-md text-primary font-bold hover:underline" href="#">Contact Support</a> or <a className="font-label-md text-label-md text-primary font-bold hover:underline" href="#">Reset Password</a>
            </p>
          </div>
        </div>

        <div className="mt-margin-lg text-center">
          <div className="flex items-center justify-center gap-2 text-outline mb-2">
            <div className="w-2 h-2 rounded-full bg-status-success animate-pulse"></div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest">All Systems Operational</span>
          </div>
          <p className="font-label-sm text-label-sm text-outline">© 2024 Longowal Logistics Solutions. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
