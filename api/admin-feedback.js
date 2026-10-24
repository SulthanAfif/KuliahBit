import { timingSafeEqual } from "node:crypto";
import { dbRequest, getCookie, send } from "./_lib/http.js";

function authorized(req) {
  const expected = process.env.ADMIN_DASHBOARD_TOKEN;
  const supplied = getCookie(req, "kb_admin");
  if (!expected || !supplied) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "Metode tidak didukung." });
  }
  if (!authorized(req)) return send(res, 401, { error: "Token admin tidak valid." });

  try {
    const feedback = await dbRequest(
      "pro_feedback?select=id,customer_email,feedback_type,rating,university,semester,message,created_at&order=created_at.desc&limit=100",
    );
    return send(res, 200, { feedback });
  } catch (error) {
    console.error("Admin feedback list error:", error);
    return send(res, 500, { error: "Data ulasan dan dukungan tidak dapat dimuat." });
  }
}
