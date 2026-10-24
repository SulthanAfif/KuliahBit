import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface PlanContextType {
  plan: "free" | "pro";
  isPro: boolean;
  isAdmin: boolean;
  expiresAt?: string;
  refreshPlan: () => Promise<boolean>;
}

export const ADMIN_AUTH_CHANGED_EVENT = "kuliahbit-admin-auth-changed";

const PlanContext = createContext<PlanContextType | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [planData, setPlanData] = useState<{ plan: "free" | "pro"; isAdmin: boolean; expiresAt?: string }>({
    plan: "free",
    isAdmin: false,
  });

  const refreshPlan = useCallback(async () => {
    try {
      const response = await fetch("/api/plan", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error("Plan lookup failed");
      const data = await response.json();
      const isAdmin = data.isAdmin === true;
      const active = isAdmin || (data.plan === "pro" && typeof data.expiresAt === "string" && Date.parse(data.expiresAt) > Date.now());
      setPlanData(active ? { plan: "pro", isAdmin, expiresAt: data.expiresAt } : { plan: "free", isAdmin: false });
      return active;
    } catch {
      setPlanData({ plan: "free", isAdmin: false });
      return false;
    }
  }, []);

  useEffect(() => {
    void refreshPlan();
    window.addEventListener(ADMIN_AUTH_CHANGED_EVENT, refreshPlan);
    return () => window.removeEventListener(ADMIN_AUTH_CHANGED_EVENT, refreshPlan);
  }, [refreshPlan]);

  useEffect(() => {
    if (!planData.isAdmin) return;
    const interval = window.setInterval(() => void refreshPlan(), 60_000);
    return () => window.clearInterval(interval);
  }, [planData.isAdmin, refreshPlan]);

  return (
    <PlanContext.Provider
      value={{
        plan: planData.plan,
        isPro: planData.plan === "pro",
        isAdmin: planData.isAdmin,
        expiresAt: planData.expiresAt,
        refreshPlan,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) throw new Error("usePlan must be used within PlanProvider");
  return context;
}
