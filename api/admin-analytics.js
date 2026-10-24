import { dbRequest, isAdmin, requireMethod, send } from "./_lib/http.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (!requireMethod(req, res, "GET")) return;
  if (!isAdmin(req)) return send(res, 401, { error: "Token admin tidak valid." });

  try {
    const analytics = await dbRequest("rpc/get_usage_analytics", {
      method: "POST",
      body: JSON.stringify({ p_days: 30 }),
    });
    return send(res, 200, analytics);
  } catch (error) {
    console.error("Admin analytics lookup error:", error);
    return send(res, 500, { error: "Data analitik tidak dapat dimuat." });
  }
}
