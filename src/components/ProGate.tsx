import { Crown, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlan } from "../context/PlanContext";
import { aiRemaining, FREE_LIMITS } from "../lib/limits";

/** Badge kuota AI — tampilkan sisa free */
export function AiQuotaBadge({ className = "" }: { className?: string }) {
  const { isPro } = usePlan();
  if (isPro) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 ${className}`}
      >
        <Crown size={12} /> Pro · AI unlimited
      </span>
    );
  }
  const left = aiRemaining(false);
  return (
    <span className={`text-xs text-gray-500 ${className}`}>
      Free · AI {left}/{FREE_LIMITS.aiPerDay} hari ini ·{" "}
      <Link to="/pricing" className="text-amber-600 hover:underline">
        Upgrade
      </Link>
    </span>
  );
}

/** Kartu upgrade saat limit tercapai */
export function UpgradeCard({
  title = "Batas Free tercapai",
  description = "Upgrade ke Pro untuk unlimited dan fitur lengkap.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
      <Lock className="text-amber-600 shrink-0 mt-0.5" size={18} />
      <div className="flex-1">
        <p className="font-medium text-amber-900 dark:text-amber-100 text-sm">{title}</p>
        <p className="text-sm text-amber-800 dark:text-amber-200 mt-0.5">{description}</p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
        >
          <Crown size={14} /> Lihat paket Pro
        </Link>
      </div>
    </div>
  );
}

/** Badge Pro di label fitur */
export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
      <Crown size={10} /> Pro
    </span>
  );
}
