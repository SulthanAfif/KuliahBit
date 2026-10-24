import { dbRequest, requireMethod, send } from "./_lib/http.js";

const VALID_EVENTS = new Set(["page_view", "interaction"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (!requireMethod(req, res, "POST")) return;

  const event = req.body?.event;
  const path = req.body?.path;
  if (
    !VALID_EVENTS.has(event) ||
    typeof path !== "string" ||
    path.length > 80 ||
    !/^\/[a-zA-Z0-9/_-]*$/.test(path) ||
    path === "/admin" ||
    path.startsWith("/admin/")
  ) {
    return send(res, 400, { error: "Data analitik tidak valid." });
  }

  try {
    await dbRequest("analytics_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ event_type: event, route: path }),
    });
    return send(res, 202, { recorded: true });
  } catch (error) {
    console.error("Analytics event recording error:", error);
    return send(res, 503, { error: "Data analitik belum dapat disimpan." });
  }
}
