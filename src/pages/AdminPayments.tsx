import { useCallback, useEffect, useState } from "react";
import { CircleDollarSign, KeyRound, LogOut, MessageSquareText, RefreshCw, Search, ShieldCheck } from "lucide-react";

type Payment = {
  invoice_number: string;
  customer_email: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  created_at: string;
  expires_at: string | null;
};

type PaymentResponse = { payments: Payment[]; total: number; limit: number; offset: number };
type Feedback = {
  id: number;
  customer_email: string;
  feedback_type: "review" | "support";
  rating: number | null;
  message: string;
  created_at: string;
};
const AUTH_KEY = "kuliahbit-admin-auth";
const PAGE_SIZE = 50;

const statusLabel: Record<Payment["status"], string> = {
  pending: "Menunggu",
  paid: "Lunas",
  failed: "Gagal",
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export default function AdminPayments() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem(AUTH_KEY) === "yes");
  const [tokenInput, setTokenInput] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);

  const loadPayments = useCallback(async (pageOffset = 0) => {
    if (!authenticated) return;
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(pageOffset), q: query, status });
      const response = await fetch(`/api/admin-payments?${params}`, { cache: "no-store", credentials: "same-origin" });
      const data = await response.json();
      if (response.status === 401) {
        sessionStorage.removeItem(AUTH_KEY);
        setAuthenticated(false);
        setPayments([]);
        throw new Error("Token admin tidak valid atau sudah tidak aktif.");
      }
      if (!response.ok) throw new Error(data.error || "Gagal memuat pembayaran.");
      const result = data as PaymentResponse;
      setPayments(result.payments);
      setTotal(result.total);
      setOffset(result.offset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pembayaran.");
    } finally {
      setBusy(false);
    }
  }, [authenticated, query, status]);

  const loadFeedback = useCallback(async () => {
    if (!authenticated) return;
    setFeedbackBusy(true);
    setFeedbackError("");
    try {
      const response = await fetch("/api/admin-feedback", { cache: "no-store", credentials: "same-origin" });
      const data = await response.json();
      if (response.status === 401) {
        sessionStorage.removeItem(AUTH_KEY);
        setAuthenticated(false);
        setFeedback([]);
        throw new Error("Token admin tidak valid atau sudah tidak aktif.");
      }
      if (!response.ok) throw new Error(data.error || "Gagal memuat ulasan dan dukungan.");
      setFeedback(data.feedback as Feedback[]);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "Gagal memuat ulasan dan dukungan.");
    } finally {
      setFeedbackBusy(false);
    }
  }, [authenticated]);

  useEffect(() => {
    if (authenticated) void loadPayments(0);
  }, [authenticated, query, status, loadPayments]);

  useEffect(() => {
    if (authenticated) void loadFeedback();
  }, [authenticated, loadFeedback]);

  useEffect(() => {
    if (!authenticated) return;
    const interval = window.setInterval(() => void loadFeedback(), 15_000);
    return () => window.clearInterval(interval);
  }, [authenticated, loadFeedback]);

  const submitToken = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanToken = tokenInput.trim();
    if (!cleanToken) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token: cleanToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login admin gagal.");
      sessionStorage.setItem(AUTH_KEY, "yes");
      setAuthenticated(true);
      setTokenInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login admin gagal.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthenticated(false);
    setPayments([]);
    setFeedback([]);
    setTotal(0);
    await fetch("/api/admin-logout", { method: "POST", credentials: "same-origin" });
  };

  if (!authenticated) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-slate-100">
        <form onSubmit={submitToken} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300"><ShieldCheck size={24} /></div>
          <h1 className="text-2xl font-bold">Admin KuliahBit</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Masukkan token admin untuk melihat transaksi dan status langganan Pro.</p>
          <label htmlFor="admin-token" className="mt-6 block text-sm font-medium">Token admin</label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 focus-within:border-amber-400">
            <KeyRound size={17} className="shrink-0 text-slate-500" />
            <input id="admin-token" type="password" required autoComplete="current-password" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} className="w-full bg-transparent py-3 text-sm outline-none" placeholder="Token dari konfigurasi server" />
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
          <button disabled={busy} className="mt-4 w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60">{busy ? "Memeriksa token…" : "Buka dashboard"}</button>
        </form>
      </main>
    );
  }

  const paidThisPage = payments.filter((item) => item.status === "paid").length;

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300"><CircleDollarSign size={19} /><span className="text-xs font-semibold uppercase tracking-[0.18em]">KuliahBit Billing</span></div>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Pembayaran Pro</h1>
            <p className="mt-1 text-sm text-slate-400">Pantau invoice, pembeli, dan masa aktif langganan.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { void loadPayments(offset); void loadFeedback(); }} disabled={busy || feedbackBusy} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-sm hover:bg-slate-900 disabled:opacity-50"><RefreshCw size={16} className={busy || feedbackBusy ? "animate-spin" : ""} /> Muat ulang</button>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-sm hover:bg-slate-900"><LogOut size={16} /> Keluar</button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">Transaksi sesuai filter</p><p className="mt-2 text-3xl font-bold">{total.toLocaleString("id-ID")}</p></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">Lunas pada halaman ini</p><p className="mt-2 text-3xl font-bold text-emerald-300">{paidThisPage.toLocaleString("id-ID")}</p></div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3"><Search size={17} className="text-slate-500" /><input aria-label="Cari email pembeli" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari email pembeli" className="w-full bg-transparent py-2.5 text-sm outline-none" /></label>
            <select aria-label="Filter status pembayaran" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm"><option value="all">Semua status</option><option value="paid">Lunas</option><option value="pending">Menunggu</option><option value="failed">Gagal</option></select>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl border border-rose-900 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{error}</p>}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Invoice / tanggal</th><th className="px-3 py-3">Email pembeli</th><th className="px-3 py-3">Nominal</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Pro aktif sampai</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {payments.map((payment) => <tr key={payment.invoice_number} className="hover:bg-slate-800/40"><td className="px-3 py-4"><span className="font-medium text-slate-200">{payment.invoice_number}</span><span className="mt-1 block text-xs text-slate-500">{formatDate(payment.created_at)}</span></td><td className="px-3 py-4 text-slate-300">{payment.customer_email}</td><td className="px-3 py-4">Rp{payment.amount.toLocaleString("id-ID")}</td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${payment.status === "paid" ? "bg-emerald-400/10 text-emerald-300" : payment.status === "pending" ? "bg-amber-300/10 text-amber-200" : "bg-rose-400/10 text-rose-300"}`}>{statusLabel[payment.status]}</span></td><td className="px-3 py-4 text-slate-400">{formatDate(payment.expires_at)}</td></tr>)}
                {!payments.length && <tr><td colSpan={5} className="px-3 py-12 text-center text-slate-500">{busy ? "Memuat transaksi…" : "Tidak ada transaksi yang cocok."}</td></tr>}
              </tbody>
            </table>
          </div>
          <footer className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4 text-sm text-slate-400">
            <span>{total ? `${offset + 1}–${Math.min(offset + payments.length, total)} dari ${total}` : "0 transaksi"}</span>
            <div className="flex gap-2"><button disabled={offset === 0 || busy} onClick={() => void loadPayments(Math.max(0, offset - PAGE_SIZE))} className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800 disabled:opacity-40">Sebelumnya</button><button disabled={offset + PAGE_SIZE >= total || busy} onClick={() => void loadPayments(offset + PAGE_SIZE)} className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800 disabled:opacity-40">Berikutnya</button></div>
          </footer>
        </section>
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300"><MessageSquareText size={19} /></div>
            <div>
              <h2 className="text-lg font-semibold">Ulasan dan dukungan pengguna Pro</h2>
              <p className="text-sm text-slate-400">Menampilkan 100 pesan terbaru dari pengguna Pro.</p>
            </div>
          </div>
          {feedbackError && <p role="alert" className="mt-4 rounded-xl border border-rose-900 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{feedbackError}</p>}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Tanggal</th><th className="px-3 py-3">Pembeli</th><th className="px-3 py-3">Jenis</th><th className="px-3 py-3">Rating</th><th className="px-3 py-3">Pesan</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {feedback.map((item) => <tr key={item.id} className="align-top hover:bg-slate-800/40">
                  <td className="whitespace-nowrap px-3 py-4 text-slate-400">{formatDate(item.created_at)}</td>
                  <td className="px-3 py-4 text-slate-300">{item.customer_email}</td>
                  <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.feedback_type === "review" ? "bg-amber-300/10 text-amber-200" : "bg-blue-400/10 text-blue-300"}`}>{item.feedback_type === "review" ? "Ulasan" : "Dukungan"}</span></td>
                  <td className="whitespace-nowrap px-3 py-4 text-amber-200">{item.rating ? `${item.rating}/5` : "—"}</td>
                  <td className="max-w-xl whitespace-pre-wrap px-3 py-4 text-slate-300">{item.message}</td>
                </tr>)}
                {!feedback.length && <tr><td colSpan={5} className="px-3 py-12 text-center text-slate-500">{feedbackBusy ? "Memuat ulasan dan dukungan…" : "Belum ada ulasan atau dukungan."}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <p className="text-xs leading-5 text-slate-500">Data pembeli berasal dari email yang diisi saat checkout DOKU. Setiap pembayaran berlaku satu bulan dan perpanjangan dilakukan manual.</p>
      </div>
    </main>
  );
}
