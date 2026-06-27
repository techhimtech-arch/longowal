import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "./api";

export type UserRole = "Admin" | "Sales Executive" | "Operations" | "Accounts";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapBackendRole(backendRole: string): UserRole {
  const roleLower = (backendRole || "").toLowerCase();
  if (roleLower.includes("admin")) return "Admin";
  if (roleLower.includes("sales")) return "Sales Executive";
  if (roleLower.includes("operations") || roleLower.includes("ops") || roleLower.includes("officer")) return "Operations";
  if (roleLower.includes("account")) return "Accounts";
  return "Admin"; // Fallback default
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/auth/profile");
      const profile = response.data.data;
      const mappedUser: User = {
        id: profile.id,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
        role: mapBackendRole(profile.role),
      };
      setUser(mappedUser);
      localStorage.setItem("ooms_user", JSON.stringify(mappedUser));
    } catch (e) {
      console.error("Failed to fetch profile", e);
      logoutState();
    } finally {
      setIsLoading(false);
    }
  };

  const logoutState = () => {
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("ooms_user");
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("ooms_user");
    
    if (token) {
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setIsLoading(false);
          // Silently refresh profile in background to keep it updated
          fetchProfile();
        } catch (e) {
          fetchProfile();
        }
      } else {
        fetchProfile();
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      
      const { accessToken, refreshToken, user: profile } = response.data.data;
      
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);

      const mappedUser: User = {
        id: profile.id || profile._id,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
        role: mapBackendRole(profile.role),
      };
      
      setUser(mappedUser);
      localStorage.setItem("ooms_user", JSON.stringify(mappedUser));
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("refresh_token");
    if (token) {
      try {
        await api.post("/auth/logout", { refreshToken: token });
      } catch (e) {
        console.error("Logout request failed", e);
      }
    }
    logoutState();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
