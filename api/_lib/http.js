export function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function requireMethod(req, res, method) {
  if (req.method === method) return true;
  res.setHeader("Allow", method);
  send(res, 405, { error: "Metode tidak didukung." });
  return false;
}

export function getSession(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)kb_session=([a-f0-9]{64})(?:;|$)/);
  return match?.[1] || null;
}

export function getCookie(req, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = (req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)(?:;|$)`));
  return match?.[1] || null;
}

export function isAdmin(req) {
  const expected = process.env.ADMIN_DASHBOARD_TOKEN;
  const supplied = getCookie(req, "kb_admin");
  if (!expected || expected.length < 32 || !/^[a-fA-F0-9]+$/.test(expected) || !supplied) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export function hashSession(value) {
  return createHash("sha256").update(value).digest("hex");
}

import { createHash, timingSafeEqual } from "node:crypto";

export function dbConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Konfigurasi Supabase belum lengkap.");
  return { url, key };
}

export async function dbRequest(path, options = {}) {
  const response = await dbFetch(path, options);
  const text = await response.text();
  if (!response.ok) throw new Error(`Database request failed (${response.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

export async function dbFetch(path, options = {}) {
  const { url, key } = dbConfig();
  return fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
