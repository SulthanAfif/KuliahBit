import { dbFetch, dbRequest, isAdmin, requireMethod, send } from "./_lib/http.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (!requireMethod(req, res, "GET")) return;
  if (!isAdmin(req)) return send(res, 401, { error: "Token admin tidak valid." });

  try {
    // Run all queries in parallel
    const [paymentsRes, subsRes, feedbackRes] = await Promise.all([
      // All payment_orders
      dbFetch("payment_orders?select=amount,status,created_at&order=created_at.desc", {
        headers: { Prefer: "count=exact" },
      }),
      // Active pro subscriptions count
      dbRequest(
        `pro_subscriptions?expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=session_hash`,
      ),
      // Feedback for ratings, campus, major stats
      dbRequest("pro_feedback?select=feedback_type,rating,university,major,created_at"),
    ]);

    const paymentsText = await paymentsRes.text();
    if (!paymentsRes.ok) throw new Error(`Payment query failed (${paymentsRes.status}): ${paymentsText}`);
    const allPayments = paymentsText ? JSON.parse(paymentsText) : [];
    const totalCount = Number(paymentsRes.headers.get("content-range")?.split("/")[1]) || 0;

    // --- Revenue stats ---
    const paidPayments = allPayments.filter((p) => p.status === "paid");
    const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingCount = allPayments.filter((p) => p.status === "pending").length;
    const failedCount = allPayments.filter((p) => p.status === "failed").length;
    const conversionRate = totalCount > 0 ? Math.round((paidPayments.length / totalCount) * 100) : 0;

    // Revenue per month (last 6 months)
    const now = new Date();
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      const total = paidPayments
        .filter((p) => {
          const pd = new Date(p.created_at);
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      revenueByMonth.push({ label, total });
    }

    // --- Active Pro subscribers ---
    const activeProCount = subsRes?.length || 0;

    // --- Feedback / rating stats ---
    const reviews = (feedbackRes || []).filter((f) => f.feedback_type === "review" && f.rating);
    const avgRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((sum, f) => sum + f.rating, 0) / reviews.length) * 10) / 10
        : null;
    const reviewCount = (feedbackRes || []).filter((f) => f.feedback_type === "review").length;
    const supportCount = (feedbackRes || []).filter((f) => f.feedback_type === "support").length;

    // Top universities
    const uniMap = new Map();
    for (const f of feedbackRes || []) {
      if (f.university) uniMap.set(f.university, (uniMap.get(f.university) || 0) + 1);
    }
    const topUniversities = [...uniMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Top majors
    const majorMap = new Map();
    for (const f of feedbackRes || []) {
      if (f.major) majorMap.set(f.major, (majorMap.get(f.major) || 0) + 1);
    }
    const topMajors = [...majorMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return send(res, 200, {
      revenue: {
        total: totalRevenue,
        byMonth: revenueByMonth,
      },
      transactions: {
        total: totalCount,
        paid: paidPayments.length,
        pending: pendingCount,
        failed: failedCount,
        conversionRate,
      },
      subscribers: {
        active: activeProCount,
      },
      feedback: {
        avgRating,
        reviewCount,
        supportCount,
        topUniversities,
        topMajors,
      },
    });
  } catch (error) {
    console.error("Admin insights error:", error);
    return send(res, 500, { error: "Data insight tidak dapat dimuat." });
  }
}

