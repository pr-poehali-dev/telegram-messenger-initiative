import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const SEND_OTP_URL = "https://functions.poehali.dev/63bba5a0-e52d-40c8-9268-ffd5bd508cc4";
const VERIFY_OTP_URL = "https://functions.poehali.dev/87bbfb85-827a-46ed-8baa-dd3c1cd2075b";

export const MAX_ACCOUNTS = 4;

export interface User {
  id: number;
  phone: string;
  name: string | null;
}

export interface Account {
  user: User;
  token: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  accounts: Account[];
  isLoading: boolean;
  sendOtp: (phone: string) => Promise<{ devCode?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  switchAccount: (userId: number) => void;
  removeAccount: (userId: number) => void;
  canAddAccount: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeAccount = accounts.find((a) => a.user.id === activeUserId) ?? null;
  const user = activeAccount?.user ?? null;
  const token = activeAccount?.token ?? null;
  const canAddAccount = accounts.length < MAX_ACCOUNTS;

  useEffect(() => {
    try {
      const savedAccounts = localStorage.getItem("auth_accounts");
      const savedActiveId = localStorage.getItem("auth_active_id");
      if (savedAccounts) {
        const parsed: Account[] = JSON.parse(savedAccounts);
        setAccounts(parsed);
        if (savedActiveId) {
          const id = Number(savedActiveId);
          if (parsed.find((a) => a.user.id === id)) {
            setActiveUserId(id);
          } else if (parsed.length > 0) {
            setActiveUserId(parsed[0].user.id);
          }
        } else if (parsed.length > 0) {
          setActiveUserId(parsed[0].user.id);
        }
      } else {
        // Backward compat: migrate old single-account storage
        const oldToken = localStorage.getItem("auth_token");
        const oldUser = localStorage.getItem("auth_user");
        if (oldToken && oldUser) {
          const u: User = JSON.parse(oldUser);
          const acc: Account = { user: u, token: oldToken };
          setAccounts([acc]);
          setActiveUserId(u.id);
          localStorage.setItem("auth_accounts", JSON.stringify([acc]));
          localStorage.setItem("auth_active_id", String(u.id));
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
        }
      }
    } catch {
      localStorage.removeItem("auth_accounts");
      localStorage.removeItem("auth_active_id");
    }
    setIsLoading(false);
  }, []);

  const saveAccounts = (accs: Account[], activeId: number | null) => {
    localStorage.setItem("auth_accounts", JSON.stringify(accs));
    if (activeId !== null) {
      localStorage.setItem("auth_active_id", String(activeId));
    } else {
      localStorage.removeItem("auth_active_id");
    }
  };

  const sendOtp = async (phone: string): Promise<{ devCode?: string }> => {
    const res = await fetch(SEND_OTP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send OTP");
    return { devCode: data.dev_code };
  };

  const verifyOtp = async (phone: string, code: string): Promise<void> => {
    const res = await fetch(VERIFY_OTP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Invalid code");

    const newAccount: Account = { user: data.user, token: data.token };

    setAccounts((prev) => {
      // Replace if same user already exists, else add
      const exists = prev.find((a) => a.user.id === data.user.id);
      const updated = exists
        ? prev.map((a) => (a.user.id === data.user.id ? newAccount : a))
        : [...prev, newAccount];
      saveAccounts(updated, data.user.id);
      return updated;
    });
    setActiveUserId(data.user.id);
  };

  const logout = () => {
    setAccounts((prev) => {
      const updated = prev.filter((a) => a.user.id !== activeUserId);
      const newActive = updated.length > 0 ? updated[0].user.id : null;
      saveAccounts(updated, newActive);
      setActiveUserId(newActive);
      return updated;
    });
  };

  const switchAccount = (userId: number) => {
    if (accounts.find((a) => a.user.id === userId)) {
      setActiveUserId(userId);
      localStorage.setItem("auth_active_id", String(userId));
    }
  };

  const removeAccount = (userId: number) => {
    setAccounts((prev) => {
      const updated = prev.filter((a) => a.user.id !== userId);
      let newActive = activeUserId;
      if (activeUserId === userId) {
        newActive = updated.length > 0 ? updated[0].user.id : null;
        setActiveUserId(newActive);
      }
      saveAccounts(updated, newActive);
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, accounts, isLoading, sendOtp, verifyOtp, logout, switchAccount, removeAccount, canAddAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
