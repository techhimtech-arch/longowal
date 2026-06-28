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
    <div className="min-h-screen bg-wireframe-bg-alt flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left graphic/brand */}
        <div className="hidden md:flex flex-col items-center justify-center bg-primary-fixed text-white p-8 gap-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-white/10 border border-white/20 shadow-sm mb-2">
            <span className="material-symbols-outlined text-[40px]">local_shipping</span>
          </div>
          <h2 className="text-2xl font-bold">Welcome to Longowal</h2>
          <p className="text-sm text-white/90 text-center max-w-[18rem]">Enterprise OOMS — manage orders, leads, and users with real-time insights.</p>
        </div>

        {/* Right: form */}
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Sign in to your account</h1>
            <p className="text-sm text-on-surface-variant mt-1">Enter your credentials to continue</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="email">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">person</span>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  {...register("email")}
                  className={`w-full pl-10 pr-4 py-3 border rounded focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-wireframe-border focus:ring-primary'}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="password">Password</label>
                <a className="text-sm text-primary hover:underline" href="#">Forgot?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-12 py-3 border rounded focus:outline-none focus:ring-2 ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-wireframe-border focus:ring-primary'}`}
                />
                <button type="button" onClick={togglePassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline">
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" {...register('rememberMe')} />
                <span className="text-on-surface-variant">Remember me</span>
              </label>
              <div className="text-sm text-on-surface-variant">Need help? <a className="text-primary hover:underline" href="#">Contact</a></div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white py-3 rounded font-medium hover:opacity-95 disabled:opacity-60">
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-on-surface-variant">
            <p>© 2024 Longowal Logistics — All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
