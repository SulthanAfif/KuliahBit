import { timingSafeEqual } from "node:crypto";
import { send } from "./_lib/http.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Metode tidak didukung." });
  }
  const appUrl = process.env.APP_URL;
  const expected = process.env.ADMIN_DASHBOARD_TOKEN;
  if (!appUrl || !expected || expected.length < 32 || !/^[a-fA-F0-9]+$/.test(expected)) {
    return send(res, 503, { error: "Token admin belum dikonfigurasi dengan aman." });
  }
  try {
    const origin = req.headers.origin;
    if (!origin || new URL(origin).origin !== new URL(appUrl).origin) {
      return send(res, 403, { error: "Permintaan dari origin yang tidak diizinkan." });
    }
  } catch {
    return send(res, 403, { error: "Origin tidak valid." });
  }
  const supplied = typeof req.body?.token === "string" ? req.body.token : "";
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  const valid = expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
  if (!valid) return send(res, 401, { error: "Token admin tidak valid." });

  const secure = new URL(appUrl).protocol === "https:" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `kb_admin=${expected}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`);
  res.setHeader("Cache-Control", "no-store");
  return send(res, 200, { authenticated: true });
}
