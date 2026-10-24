import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface PlanContextType {
  plan: "free" | "pro";
  isPro: boolean;
  expiresAt?: string;
  refreshPlan: () => Promise<boolean>;
}

const PlanContext = createContext<PlanContextType | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [planData, setPlanData] = useState<{ plan: "free" | "pro"; expiresAt?: string }>({ plan: "free" });

  const refreshPlan = useCallback(async () => {
    try {
      const response = await fetch("/api/plan", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error("Plan lookup failed");
      const data = await response.json();
      const active = data.plan === "pro" && typeof data.expiresAt === "string" && Date.parse(data.expiresAt) > Date.now();
      setPlanData(active ? { plan: "pro", expiresAt: data.expiresAt } : { plan: "free" });
      return active;
    } catch {
      setPlanData({ plan: "free" });
      return false;
    }
  }, []);

  useEffect(() => { void refreshPlan(); }, [refreshPlan]);

  return (
    <PlanContext.Provider
      value={{
        plan: planData.plan,
        isPro: planData.plan === "pro",
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
