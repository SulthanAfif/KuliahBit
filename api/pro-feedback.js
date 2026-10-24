import { dbRequest, getSession, hashSession, requireMethod, send } from "./_lib/http.js";

export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const appUrl = process.env.APP_URL;
  if (!appUrl) return send(res, 503, { error: "Formulir belum dikonfigurasi di server." });
  try {
    const origin = req.headers.origin;
    if (!origin || new URL(origin).origin !== new URL(appUrl).origin) {
      return send(res, 403, { error: "Permintaan dari origin yang tidak diizinkan." });
    }

    const session = getSession(req);
    if (!session) return send(res, 403, { error: "Formulir ini hanya tersedia untuk pengguna Pro." });
    const sessionHash = hashSession(session);
    const subscriptions = await dbRequest(
      `pro_subscriptions?session_hash=eq.${sessionHash}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=expires_at&limit=1`,
    );
    if (!subscriptions?.length) {
      return send(res, 403, { error: "Langganan Pro aktif diperlukan untuk mengirim ulasan atau dukungan." });
    }

    const type = req.body?.type;
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const rating = req.body?.rating;
    const university = typeof req.body?.university === "string" ? req.body.university.trim() : "";
    const major = typeof req.body?.major === "string" ? req.body.major.trim() : "";
    const semester = req.body?.semester;
    if (type !== "review" && type !== "support") {
      return send(res, 400, { error: "Pilih jenis ulasan atau dukungan." });
    }
    if (university.length < 2 || university.length > 120) {
      return send(res, 400, { error: "Nama kampus harus berisi 2–120 karakter." });
    }
    if (major.length < 2 || major.length > 120) {
      return send(res, 400, { error: "Nama jurusan harus berisi 2–120 karakter." });
    }
    if (!Number.isInteger(semester) || semester < 1 || semester > 20) {
      return send(res, 400, { error: "Pilih semester dari 1 sampai 20." });
    }
    if (message.length < 10 || message.length > 2000) {
      return send(res, 400, { error: "Pesan harus berisi 10–2.000 karakter." });
    }
    if (type === "review" && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return send(res, 400, { error: "Pilih rating ulasan dari 1 sampai 5." });
    }

    const invoices = await dbRequest(
      `payment_orders?session_hash=eq.${sessionHash}&status=eq.paid&select=customer_email&order=created_at.desc&limit=1`,
    );
    const email = invoices?.[0]?.customer_email;
    if (!email) return send(res, 409, { error: "Email transaksi Pro tidak ditemukan." });

    await dbRequest("pro_feedback", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        session_hash: sessionHash,
        customer_email: email,
        feedback_type: type,
        rating: type === "review" ? rating : null,
        university,
        major,
        semester,
        message,
      }),
    });
    return send(res, 201, { submitted: true });
  } catch (error) {
    console.error("Pro feedback submission error:", error);
    return send(res, 500, { error: "Ulasan atau dukungan belum dapat dikirim. Coba lagi nanti." });
  }
}
