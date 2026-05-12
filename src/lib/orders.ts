import { getRedis, KEYS } from "./redis";

export interface Order {
  id: string;
  name: string;
  whatsapp: string;
  service: string;
  imei: string;
  price: number;
  status: string;
  result: unknown;
  apiOrderId: string | null;
  createdAt: string;
  processedAt: string | null;
  payment_method?: string;
  payment_proof?: string;
  [key: string]: unknown;
}

export async function loadOrders(): Promise<Order[]> {
  const rdb = await getRedis();
  const data = await rdb.get(KEYS.ORDERS);
  return data ? JSON.parse(data) : [];
}

export async function saveOrders(orders: Order[]) {
  const rdb = await getRedis();
  await rdb.set(KEYS.ORDERS, JSON.stringify(orders));
}

export async function getCounter(): Promise<number> {
  const rdb = await getRedis();
  const val = await rdb.get(KEYS.COUNTER);
  return val ? parseInt(val) : 0;
}

export async function setCounter(val: number) {
  const rdb = await getRedis();
  await rdb.set(KEYS.COUNTER, String(val));
}
