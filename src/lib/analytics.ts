export type AnalyticsEvent = "page_view" | "interaction";

export async function trackAnalytics(event: AnalyticsEvent, path: string): Promise<void> {
  const response = await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    keepalive: true,
    body: JSON.stringify({ event, path }),
  });
  if (!response.ok) throw new Error(`Analytics request failed (${response.status}).`);
}
