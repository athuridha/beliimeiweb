import { createClient } from "redis";

const REDIS_URL =
  process.env.REDIS_URL ||
  "redis://default:qgGKOMOyCJbLykCliVvZ88CTojfrHgYx@redis-19643.crce194.ap-seast-1-1.ec2.cloud.redislabs.com:19643";

let client: ReturnType<typeof createClient> | null = null;

export async function getRedis() {
  if (!client) {
    client = createClient({ url: REDIS_URL });
    client.on("error", (err) => console.error("Redis error:", err));
    await client.connect();
  }
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

// Keys
export const KEYS = {
  ADMIN_CREDENTIALS: "cekimei:admin_credentials",
  SECRETS: "cekimei:secrets",
  ORDERS: "cekimei:orders",
  COUNTER: "cekimei:order_counter",
  PRICING: "cekimei:pricing",
  API_PRICES: "cekimei:api_prices",
  TESTIMONIALS: "cekimei:testimonials",
  REVIEW_TOKENS: "cekimei:review_tokens",
  LANDING_CONFIG: "cekimei:landing_config",
  PAYMENT_METHODS: "cekimei:payment_methods",
};

export const VALID_SERVICES = new Set(["roamer", "roamer_instant"]);
export const ADMIN_WA = process.env.ADMIN_WA || "085213971757";

export const DEFAULT_SELL_PRICES: Record<string, number> = {
  roamer_instant: 130000,
  roamer: 100000,
};

export const DEFAULT_SERVICE_NAMES: Record<string, string> = {
  roamer_instant: "Add Roamer 3 Bulan (Fast)",
  roamer: "Add Roamer 3 Bulan (Selow)",
};

export const QRIS_STATIC =
  process.env.QRIS_STATIC ||
  "00020101021126610014COM.GO-JEK.WWW01189360091430166322970210G0166322970303UMI51440014ID.CO.QRIS.WWW0215ID10264728076210303UMI5204829953033605802ID5925amar international school6008KARAWANG61054136362070703A0163049DF7";

// Helper functions
export async function getSecret(name: string, fallback = ""): Promise<string> {
  const envVal = process.env[name];
  if (envVal) return envVal;
  const rdb = await getRedis();
  const val = await rdb.hGet(KEYS.SECRETS, name);
  return val || fallback;
}

export async function getPricing() {
  const rdb = await getRedis();
  const data = await rdb.get(KEYS.PRICING);
  if (data) return JSON.parse(data);
  // Initialize
  const init: Record<string, { sell_price: number; name: string }> = {};
  for (const code of VALID_SERVICES) {
    init[code] = {
      sell_price: DEFAULT_SELL_PRICES[code] || 0,
      name: DEFAULT_SERVICE_NAMES[code] || code,
    };
  }
  await rdb.set(KEYS.PRICING, JSON.stringify(init));
  return init;
}

export async function setPricing(pricing: Record<string, unknown>) {
  const rdb = await getRedis();
  await rdb.set(KEYS.PRICING, JSON.stringify(pricing));
}

export async function getApiPrices() {
  const rdb = await getRedis();
  const data = await rdb.get(KEYS.API_PRICES);
  return data ? JSON.parse(data) : {};
}

export async function setApiPrices(prices: Record<string, unknown>) {
  const rdb = await getRedis();
  await rdb.set(KEYS.API_PRICES, JSON.stringify(prices));
}

export async function getServiceNames() {
  const pricing = await getPricing();
  const result: Record<string, string> = {};
  for (const code of VALID_SERVICES) {
    const p = pricing[code] || {};
    const name = p.name || DEFAULT_SERVICE_NAMES[code] || code;
    const sellPrice = p.sell_price || DEFAULT_SELL_PRICES[code] || 0;
    result[code] = `${name} - Rp ${sellPrice.toLocaleString("id-ID")}`;
  }
  return result;
}

export async function getTestimonials(): Promise<unknown[]> {
  const rdb = await getRedis();
  const data = await rdb.get(KEYS.TESTIMONIALS);
  return data ? JSON.parse(data) : [];
}

export async function saveTestimonials(items: unknown[]) {
  const rdb = await getRedis();
  await rdb.set(KEYS.TESTIMONIALS, JSON.stringify(items));
}

export async function getReviewTokens(): Promise<Record<string, unknown>> {
  const rdb = await getRedis();
  const data = await rdb.get(KEYS.REVIEW_TOKENS);
  return data ? JSON.parse(data) : {};
}

export async function saveReviewTokens(tokens: Record<string, unknown>) {
  const rdb = await getRedis();
  await rdb.set(KEYS.REVIEW_TOKENS, JSON.stringify(tokens));
}

export async function getLandingConfig(): Promise<Record<string, string>> {
  const rdb = await getRedis();
  const data = await rdb.get(KEYS.LANDING_CONFIG);
  return data ? JSON.parse(data) : {};
}

export async function saveLandingConfig(config: Record<string, string>) {
  const rdb = await getRedis();
  await rdb.set(KEYS.LANDING_CONFIG, JSON.stringify(config));
}

export async function getPaymentMethods(): Promise<unknown[]> {
  const rdb = await getRedis();
  const data = await rdb.get(KEYS.PAYMENT_METHODS);
  if (data) return JSON.parse(data);
  const defaults = [
    { id: "qris-default", type: "qris", label: "QRIS (GoPay)", enabled: true },
  ];
  await rdb.set(KEYS.PAYMENT_METHODS, JSON.stringify(defaults));
  return defaults;
}

export async function savePaymentMethods(methods: unknown[]) {
  const rdb = await getRedis();
  await rdb.set(KEYS.PAYMENT_METHODS, JSON.stringify(methods));
}
