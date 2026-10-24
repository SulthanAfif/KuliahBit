import { send } from "./_lib/http.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Metode tidak didukung." });
  }
  const secure = process.env.APP_URL?.startsWith("https://") ? "; Secure" : "";
  res.setHeader("Set-Cookie", `kb_admin=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
  res.setHeader("Cache-Control", "no-store");
  return send(res, 200, { authenticated: false });
}
