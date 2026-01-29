import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { AuthService } from "../services/auth/auth.service";
import { PocketBaseService } from "../services/pocketbase/pocketbase.service";
import { User } from "../types/user.contract";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  authenticated: boolean;
  signIn: (nickname: string, password: string) => Promise<void>;
  signInWithOAuth: (
    provider: "google" | "discord",
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    createData?: Record<string, any>,
  ) => Promise<void>;
  signOut: () => void;
  checkAuth: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authService] = useState(() => new AuthService());

  const checkAuth = async () => {
    try {
      setLoading(true);

      // Wait for PocketBase to load auth from storage first
      await PocketBaseService.waitForInit();

      const currentUser = authService.getCurrentUser();

      if (currentUser && authService.isAuthenticated()) {
        // Try to refresh token to ensure it's still valid
        try {
          await authService.refreshAuth();
          const refreshedUser = authService.getCurrentUser();
          setUser(refreshedUser);
        } catch (error) {
          // Token might be expired, clear user
          console.log("Auth refresh failed, clearing user:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const signIn = async (nickname: string, password: string) => {
    try {
      setLoading(true);
      const result = await authService.signInWithPassword(nickname, password);
      setUser(result.record as User);
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithOAuth = async (
    provider: "google" | "discord",
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    createData?: Record<string, any>,
  ) => {
    try {
      setLoading(true);

      // Ensure PocketBase is fully initialized before attempting OAuth
      await PocketBaseService.waitForInit();

      const result = await authService.signInWithOAuth(
        provider,
        code,
        codeVerifier,
        redirectUrl,
        createData,
      );
      setUser(result.record as User);
    } catch (error) {
      console.error("OAuth sign in error:", error);
      // Reset user state on error to prevent inconsistent state
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    authService.signOut();
    setUser(null);
  };

  const refreshAuth = async () => {
    try {
      await authService.refreshAuth();
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error refreshing auth:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    initialized,
    authenticated: !!user,
    signIn,
    signInWithOAuth,
    signOut,
    checkAuth,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
