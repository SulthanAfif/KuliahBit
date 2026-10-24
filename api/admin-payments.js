import { timingSafeEqual } from "node:crypto";
import { dbFetch, dbRequest, getCookie, send } from "./_lib/http.js";

function authorized(req) {
  const expected = process.env.ADMIN_DASHBOARD_TOKEN;
  const supplied = getCookie(req, "kb_admin");
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "Metode tidak didukung." });
  }
  if (!authorized(req)) return send(res, 401, { error: "Token admin tidak valid." });

  try {
    const url = new URL(req.url, "https://kuliahbit.local");
    const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
    const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0);
    const status = url.searchParams.get("status") || "all";
    const search = (url.searchParams.get("q") || "").replace(/[^a-zA-Z0-9@._+-]/g, "").slice(0, 128);
    const query = new URLSearchParams({
      select: "invoice_number,customer_email,amount,status,created_at,session_hash",
      order: "created_at.desc",
      limit: String(limit),
      offset: String(offset),
    });
    if (["pending", "paid", "failed"].includes(status)) query.set("status", `eq.${status}`);
    if (search) query.set("customer_email", `ilike.*${search}*`);

    const ordersResponse = await dbFetch(`payment_orders?${query}`, {
      headers: { Prefer: "count=exact" },
    });
    const orderText = await ordersResponse.text();
    if (!ordersResponse.ok) throw new Error(`Payment query failed (${ordersResponse.status}): ${orderText}`);
    const orders = orderText ? JSON.parse(orderText) : [];
    const total = Number(ordersResponse.headers.get("content-range")?.split("/")[1]) || 0;
    const hashes = [...new Set(orders.map((order) => order.session_hash))];
    let subscriptions = [];
    if (hashes.length) {
      const inFilter = `(${hashes.join(",")})`;
      subscriptions = await dbRequest(`pro_subscriptions?session_hash=in.${inFilter}&select=session_hash,expires_at`);
    }
    const expiryByHash = new Map(subscriptions.map((item) => [item.session_hash, item.expires_at]));
    const payments = orders.map(({ session_hash, ...order }) => ({
      ...order,
      expires_at: expiryByHash.get(session_hash) || null,
    }));
    return send(res, 200, { payments, total, limit, offset });
  } catch (error) {
    console.error("Admin payment list error:", error);
    return send(res, 500, { error: "Data pembayaran tidak dapat dimuat." });
  }
}
