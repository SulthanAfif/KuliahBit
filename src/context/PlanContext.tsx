import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import type { UserPlan } from "../types";

interface PlanContextType {
  plan: "free" | "pro";
  isPro: boolean;
  activatePro: (days?: number) => void;
  deactivatePro: () => void;
}

const PlanContext = createContext<PlanContextType | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [planData, setPlanData] = useState<UserPlan>({ plan: "free" });

  useEffect(() => {
    const saved = getFromStorage<UserPlan>("user-plan", { plan: "free" });
    // Check expiry
    if (saved.plan === "pro" && saved.expiresAt) {
      if (new Date(saved.expiresAt) < new Date()) {
        setPlanData({ plan: "free" });
        saveToStorage("user-plan", { plan: "free" });
        return;
      }
    }
    setPlanData(saved);
  }, []);

  const activatePro = (days = 30) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    const data: UserPlan = { plan: "pro", expiresAt: expiresAt.toISOString() };
    setPlanData(data);
    saveToStorage("user-plan", data);
  };

  const deactivatePro = () => {
    const data: UserPlan = { plan: "free" };
    setPlanData(data);
    saveToStorage("user-plan", data);
  };

  return (
    <PlanContext.Provider
      value={{
        plan: planData.plan,
        isPro: planData.plan === "pro",
        activatePro,
        deactivatePro,
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
