import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { dbRequest, requireMethod, send } from "./_lib/http.js";

const TARGET = "/api/doku-notification";

function validSignature(req, rawBody, clientId, secret) {
  const requestClientId = req.headers["client-id"];
  const requestId = req.headers["request-id"];
  const timestamp = req.headers["request-timestamp"];
  const signature = req.headers.signature;
  if (requestClientId !== clientId || !requestId || !timestamp || typeof signature !== "string") return false;
  const digest = createHash("sha256").update(rawBody).digest("base64");
  const message = `Client-Id:${requestClientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${TARGET}\nDigest:${digest}`;
  const expected = Buffer.from(`HMACSHA256=${createHmac("sha256", secret).update(message).digest("base64")}`);
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  const clientId = process.env.DOKU_CLIENT_ID;
  const secret = process.env.DOKU_SECRET_KEY;
  if (!clientId || !secret) return send(res, 503, { error: "Notifikasi belum dikonfigurasi." });

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);
    if (!validSignature(req, rawBody, clientId, secret)) return send(res, 401, { error: "Signature DOKU tidak valid." });

    const notification = JSON.parse(rawBody.toString("utf8"));
    const invoice = notification?.order?.invoice_number;
    const amount = Number(notification?.order?.amount);
    const status = notification?.transaction?.status;
    if (typeof invoice !== "string" || !invoice.startsWith("KB")) return send(res, 400, { error: "Invoice tidak valid." });

    if (status === "SUCCESS") {
      await dbRequest("rpc/fulfill_pro_payment", {
        method: "POST",
        body: JSON.stringify({ p_invoice_number: invoice, p_amount: amount }),
      });
    }
    // Checkout may report FAILED while the customer is choosing another payment method.
    return send(res, 200, { received: true });
  } catch (error) {
    console.error("DOKU notification error:", error);
    return send(res, 500, { error: "Notifikasi belum dapat diproses." });
  }
}
