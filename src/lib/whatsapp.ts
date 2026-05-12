import { getSecret, ADMIN_WA, getServiceNames } from "./redis";

async function getFonnteToken(): Promise<string> {
  return getSecret("FONNTE_TOKEN");
}

export async function sendWa(target: string, message: string) {
  const token = await getFonnteToken();
  if (!token) return;
  try {
    await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ target, message }),
    });
  } catch {
    // silent fail
  }
}

interface Order {
  id: string;
  name: string;
  whatsapp: string;
  service: string;
  imei: string;
  status: string;
  result?: unknown;
  createdAt: string;
  [key: string]: unknown;
}

export async function sendAdminNotification(order: Order) {
  const serviceNames = await getServiceNames();
  const serviceLabel = serviceNames[order.service] || order.service;
  const message =
    `*PESANAN BARU!*\n\n` +
    `ID: ${order.id}\n` +
    `Nama: ${order.name}\n` +
    `WA: ${order.whatsapp}\n` +
    `Layanan: ${serviceLabel}\n` +
    `IMEI: ${order.imei}\n` +
    `Waktu: ${order.createdAt}\n\n` +
    `Silakan cek admin panel untuk memproses pesanan.`;
  await sendWa(ADMIN_WA, message);
}

export async function notifyCustomer(order: Order) {
  const serviceNames = await getServiceNames();
  const serviceLabel = serviceNames[order.service] || order.service;
  let message = "";
  if (order.status === "completed") {
    message =
      `Halo ${order.name}!\n\n` +
      `Pesanan kamu *${order.id}* sudah selesai diproses.\n\n` +
      `Layanan: ${serviceLabel}\nIMEI: ${order.imei}\nStatus: Berhasil\n\n` +
      `Terima kasih sudah menggunakan layanan kami!`;
  } else if (order.status === "waiting") {
    message =
      `Halo ${order.name}!\n\n` +
      `Pesanan kamu *${order.id}* sedang diproses.\n\n` +
      `Layanan: ${serviceLabel}\nIMEI: ${order.imei}\nStatus: Sedang diproses, harap tunggu.\n\n` +
      `Kami akan kabari lagi setelah selesai.`;
  } else if (order.status === "failed") {
    message =
      `Halo ${order.name}!\n\n` +
      `Mohon maaf, pesanan *${order.id}* gagal diproses.\n\n` +
      `Layanan: ${serviceLabel}\nIMEI: ${order.imei}\nKeterangan: ${order.result || "Gagal"}\n\n` +
      `Silakan hubungi admin untuk info lebih lanjut.`;
  } else if (order.status === "pending") {
    const priceStr = typeof order.price === "number" ? order.price.toLocaleString("id-ID") : Number(order.price || 0).toLocaleString("id-ID");
    message =
      `Halo ${order.name}!\n\n` +
      `Terima kasih! Pesanan kamu dengan Order ID *${order.id}* telah kami terima.\n\n` +
      `Layanan: ${serviceLabel}\nIMEI: ${order.imei}\nTotal Tagihan: Rp ${priceStr}\n\n` +
      `Admin kami akan segera menghubungi kamu atau mengecek pesananmu. Gunakan Order ID di atas untuk melacak pesanan di menu Lacak Pesanan pada website.`;
  } else {
    return;
  }
  await sendWa(order.whatsapp, message);
}
