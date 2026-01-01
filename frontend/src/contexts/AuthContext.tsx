import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { registerUser, loginUser, verifyEmail, refreshToken as refreshTokenAPI, getCurrentUser } from "../api-auth";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  email_verified: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  verifyEmailToken: (token: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from session storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const accessToken = sessionStorage.getItem("access_token");
        if (accessToken) {
          // Try to get user info
          try {
            const userData = await getCurrentUser();
            setUser(userData);
          } catch (error) {
            // Token might be expired, try to refresh
            const refreshTokenStr = sessionStorage.getItem("refresh_token");
            if (refreshTokenStr) {
              try {
                await refreshTokenAPI();
                const userData = await getCurrentUser();
                setUser(userData);
              } catch {
                // Refresh failed, clear tokens
                sessionStorage.removeItem("access_token");
                sessionStorage.removeItem("refresh_token");
              }
            } else {
              sessionStorage.removeItem("access_token");
            }
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const register = async (email: string, password: string, fullName: string, phone?: string) => {
    const response = await registerUser({ email, password, full_name: fullName, phone });
    // Registration successful - user needs to verify email
    // Don't set user or tokens yet
  };

  const login = async (email: string, password: string) => {
    const response = await loginUser({ email, password });
    
    // Store tokens
    sessionStorage.setItem("access_token", response.access_token);
    sessionStorage.setItem("refresh_token", response.refresh_token);
    
    // Get user info
    const userData = await getCurrentUser();
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    setUser(null);
  };

  const verifyEmailToken = async (token: string) => {
    await verifyEmail({ token });
    // After verification, refresh user data if logged in
    if (user) {
      const userData = await getCurrentUser();
      setUser(userData);
    }
  };

  const refreshToken = async () => {
    const refreshTokenStr = sessionStorage.getItem("refresh_token");
    if (!refreshTokenStr) {
      throw new Error("No refresh token available");
    }
    
    const response = await refreshTokenAPI();
    sessionStorage.setItem("access_token", response.access_token);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        verifyEmailToken,
        refreshToken,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

