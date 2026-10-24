import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { dbRequest, getSession, hashSession, requireMethod, send } from "./_lib/http.js";

const PRICE_IDR = 25_000;
const TARGET = "/checkout/v1/payment";

function checkoutSignature(clientId, requestId, timestamp, body, secret) {
  const digest = createHash("sha256").update(body).digest("base64");
  const message = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${TARGET}\nDigest:${digest}`;
  return `HMACSHA256=${createHmac("sha256", secret).update(message).digest("base64")}`;
}

export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;

  const appUrl = process.env.APP_URL;
  const clientId = process.env.DOKU_CLIENT_ID;
  const secret = process.env.DOKU_SECRET_KEY;
  if (!appUrl || !clientId || !secret) {
    return send(res, 503, { error: "Pembayaran belum dikonfigurasi di server." });
  }
  try {
    const origin = req.headers.origin;
    if (!origin || new URL(origin).origin !== new URL(appUrl).origin) {
      return send(res, 403, { error: "Permintaan dari origin yang tidak diizinkan." });
    }

    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (email.length > 128 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return send(res, 400, { error: "Masukkan alamat email yang valid." });
    }

    const session = getSession(req) || randomBytes(32).toString("hex");
    const sessionHash = hashSession(session);
    const invoice = `KB${Date.now()}${randomBytes(5).toString("hex").toUpperCase()}`;
    const requestId = randomUUID();
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const payload = {
      order: {
        amount: PRICE_IDR,
        invoice_number: invoice,
        currency: "IDR",
        callback_url: `${appUrl.replace(/\/$/, "")}/pricing?payment=return`,
        callback_url_result: `${appUrl.replace(/\/$/, "")}/pricing?payment=return`,
        auto_redirect: true,
        line_items: [{ id: "KULIAHBIT-PRO-1M", name: "KuliahBit Pro (1 bulan)", quantity: 1, price: PRICE_IDR }],
      },
      payment: { payment_due_date: 60 },
      customer: { email },
    };
    const body = JSON.stringify(payload);

    await dbRequest("payment_orders", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ invoice_number: invoice, session_hash: sessionHash, customer_email: email, amount: PRICE_IDR, status: "pending" }),
    });

    const endpoint = process.env.DOKU_ENV === "production"
      ? "https://api.doku.com/checkout/v1/payment"
      : "https://api-sandbox.doku.com/checkout/v1/payment";
    const dokuResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": clientId,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        Signature: checkoutSignature(clientId, requestId, timestamp, body, secret),
      },
      body,
    });
    const result = await dokuResponse.json();
    const paymentUrl = result?.response?.payment?.url;
    if (!dokuResponse.ok || typeof paymentUrl !== "string" || !paymentUrl.startsWith("https://")) {
      await dbRequest(`payment_orders?invoice_number=eq.${encodeURIComponent(invoice)}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "failed" }),
      });
      return send(res, 502, { error: "DOKU gagal membuat sesi pembayaran." });
    }

    const cookie = `kb_session=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(appUrl).protocol === "https:" ? "; Secure" : ""}`;
    res.setHeader("Set-Cookie", cookie);
    return send(res, 200, { paymentUrl });
  } catch (error) {
    console.error("DOKU checkout error:", error);
    return send(res, 500, { error: "Tidak dapat memulai pembayaran. Coba lagi nanti." });
  }
}
