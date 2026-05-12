import crypto from "crypto";
import { getRedis, KEYS, getSecret } from "./redis";

let tokenSecret: string | null = null;

async function getTokenSecret(): Promise<string> {
  if (tokenSecret) return tokenSecret;
  tokenSecret = await getSecret("TOKEN_SECRET", crypto.randomBytes(32).toString("hex"));
  const rdb = await getRedis();
  const existing = await rdb.hGet(KEYS.SECRETS, "TOKEN_SECRET");
  if (!existing) {
    await rdb.hSet(KEYS.SECRETS, "TOKEN_SECRET", tokenSecret);
  } else {
    tokenSecret = existing;
  }
  return tokenSecret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hashed = crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${hashed}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored.includes(":")) return password === stored;
  const [salt, hashed] = stored.split(":", 2);
  const check = crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return check === hashed;
}

export async function createAdminToken(username: string): Promise<string> {
  const secret = await getTokenSecret();
  const payload = `${username}:${Math.floor(Date.now() / 1000)}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  const secret = await getTokenSecret();
  const lastColon = token.lastIndexOf(":");
  if (lastColon === -1) return false;
  const payload = token.substring(0, lastColon);
  const sig = token.substring(lastColon + 1);
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    const ts = parseInt(payload.split(":")[1]);
    if (Date.now() / 1000 - ts > 86400) return false;
  } catch {
    return false;
  }
  return true;
}

export async function adminAuth(authHeader: string | null): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  return verifyAdminToken(authHeader.substring(7));
}

export async function initAdmin() {
  const rdb = await getRedis();
  const existing = await rdb.hGet(KEYS.ADMIN_CREDENTIALS, "admin");
  if (!existing) {
    await rdb.hSet(KEYS.ADMIN_CREDENTIALS, "admin", hashPassword("admin123"));
  }
}
