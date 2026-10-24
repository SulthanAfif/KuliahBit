import { dbRequest, getSession, hashSession, isAdmin, requireMethod, send } from "./_lib/http.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (!requireMethod(req, res, "GET")) return;
  if (isAdmin(req)) return send(res, 200, { plan: "pro", isAdmin: true });
  try {
    const session = getSession(req);
    if (!session) return send(res, 200, { plan: "free" });
    const sessionHash = hashSession(session);
    const rows = await dbRequest(`pro_subscriptions?session_hash=eq.${sessionHash}&select=expires_at&limit=1`);
    const expiresAt = rows?.[0]?.expires_at;
    if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) return send(res, 200, { plan: "free" });
    return send(res, 200, { plan: "pro", expiresAt });
  } catch (error) {
    console.error("Plan lookup error:", error);
    return send(res, 503, { error: "Status paket belum dapat dimuat." });
  }
}
