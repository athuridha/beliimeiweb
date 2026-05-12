import { getSecret, setApiPrices } from "./redis";

const PROXY_BASE = "http://cekceir-proxy.beliimei-proxy.workers.dev/proxy";
const PROXY_SECRET = "bimei-proxy-k8x9z2m4";

async function getApiKey(): Promise<string> {
  return getSecret("CEKCEIR_API_KEY");
}

async function headers(extra?: Record<string, string>): Promise<Record<string, string>> {
  const apiKey = await getApiKey();
  const h: Record<string, string> = { "X-Proxy-Secret": PROXY_SECRET, "X-Api-Key": apiKey };
  if (extra) Object.assign(h, extra);
  return h;
}

async function safeFetch(url: string, opts: RequestInit = {}): Promise<Record<string, unknown>> {
  try {
    const resp = await fetch(url, { ...opts, signal: AbortSignal.timeout(30000) });
    const ct = resp.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await resp.json() as Record<string, unknown>;
    return { status: false, message: `Non-JSON response (HTTP ${resp.status}). IP mungkin belum di-whitelist.` };
  } catch (e) {
    return { status: false, message: String(e) };
  }
}

export const ALLOWED_STATUSES = new Set(["UNKNOWN"]);

export async function fetchApiServices() {
  const h = await headers();
  const data = await safeFetch(`${PROXY_BASE}/services`, { method: "POST", headers: h });
  if (data.status && (data.data as Record<string, unknown>)?.services) {
    const services = (data.data as Record<string, unknown>).services as Array<{ code: string; name: string; price: number }>;
    const prices: Record<string, { name: string; price: number }> = {};
    for (const svc of services) {
      prices[svc.code] = { name: svc.name, price: svc.price };
    }
    await setApiPrices(prices);
    return { success: true, services: prices };
  }
  return { success: false, message: (data.message as string) || "Failed" };
}

export async function fetchApiBalance() {
  const h = await headers();
  const data = await safeFetch(`${PROXY_BASE}/balance`, { method: "POST", headers: h });
  if (data.status) {
    return { success: true, balance: (data.data as Record<string, unknown>).balance };
  }
  return { success: false, message: (data.message as string) || "Failed" };
}

export async function checkImeiStatus(imei: string) {
  const h = await headers({ "Content-Type": "application/json" });
  const data = await safeFetch(`${PROXY_BASE}/order`, {
    method: "POST", headers: h, body: JSON.stringify({ service: "status", imei }),
  });

  if (!data.status) return { status: null, message: (data.message as string) || "Gagal cek status", raw: data };

  const orderId = ((data.data as Record<string, unknown>)?.order_id as string) || "";
  if (!orderId) return { status: null, message: "Tidak dapat order_id dari cek status", raw: data };

  for (let i = 0; i < 10; i++) {
    try {
      const h2 = await headers();
      const sdata = await safeFetch(`${PROXY_BASE}/status?order_id=${orderId}`, { headers: h2 });
      if (sdata.status && (sdata.data as Record<string, unknown>)?.status === "Success") {
        const result = (sdata.data as Record<string, unknown>)?.result;
        let imeiStatus = "UNKNOWN";
        if (typeof result === "string") {
          for (const line of result.split("\n")) {
            if (line.trim().startsWith("Status:")) {
              imeiStatus = line.split(":")[1].trim().toUpperCase();
              break;
            }
          }
        } else if (typeof result === "object" && result) {
          imeiStatus = ((result as Record<string, unknown>).status as string || "UNKNOWN").toUpperCase();
        }
        return { status: imeiStatus, message: typeof result === "string" ? result : JSON.stringify(result), raw: sdata };
      }
      if ((sdata.data as Record<string, unknown>)?.status === "Failed") {
        return { status: null, message: "Cek status gagal", raw: sdata };
      }
    } catch { /* continue */ }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { status: null, message: "Timeout menunggu hasil cek IMEI", raw: null };
}

export async function processOrderApi(service: string, imei: string) {
  const h = await headers({ "Content-Type": "application/json" });
  return safeFetch(`${PROXY_BASE}/order`, {
    method: "POST", headers: h, body: JSON.stringify({ service, imei }),
  });
}

export async function checkApiStatus(apiOrderId: string) {
  const h = await headers();
  return safeFetch(`${PROXY_BASE}/status?order_id=${apiOrderId}`, { headers: h });
}

export async function verifyApiKey() {
  const h = await headers();
  return safeFetch(`${PROXY_BASE}/auth`, { method: "POST", headers: h });
}

export async function apiOrderCeir(service: string, imei: string) {
  const h = await headers({ "Content-Type": "application/json" });
  return safeFetch(`${PROXY_BASE}/order`, {
    method: "POST", headers: h, body: JSON.stringify({ service, imei }),
  });
}

export async function apiCheckCeirStatus(orderId: string) {
  const h = await headers();
  return safeFetch(`${PROXY_BASE}/status?order_id=${orderId}`, { headers: h });
}

export async function apiRoamerAdd(imei: string, months = 3) {
  const h = await headers({ "Content-Type": "application/json" });
  return safeFetch(`${PROXY_BASE}/roamer/add`, {
    method: "POST", headers: h, body: JSON.stringify({ imei, months }),
  });
}

export async function apiRoamerInstant(imei: string) {
  const h = await headers({ "Content-Type": "application/json" });
  return safeFetch(`${PROXY_BASE}/roamer/instant`, {
    method: "POST", headers: h, body: JSON.stringify({ imei }),
  });
}

export async function apiRoamerStatus(orderId: string) {
  const h = await headers();
  return safeFetch(`${PROXY_BASE}/roamer/status?order_id=${orderId}`, { headers: h });
}
