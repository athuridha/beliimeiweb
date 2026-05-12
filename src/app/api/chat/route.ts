import { getSecret, getPricing } from "@/lib/redis";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Kamu adalah asisten virtual BeliIMEI, sebuah layanan aktivasi IMEI resmi di Indonesia.

TENTANG BELIIMEI:
- BeliIMEI menyediakan layanan roamer IMEI agar perangkat bisa digunakan dengan kartu SIM operator Indonesia.
- Layanan ini 100% resmi dan terdaftar di sistem CEIR Kemenperin.
- Roamer IMEI berlaku selama 3 bulan sejak tanggal aktivasi.
- Ada garansi uang kembali 100% jika proses aktivasi gagal.
- Support tersedia 24/7 via WhatsApp.

LAYANAN YANG TERSEDIA:
{SERVICES}

CARA KERJA:
1. Pelanggan isi form pesanan (IMEI, nama, nomor WA)
2. Pilih metode pembayaran (QRIS/Transfer)
3. Admin verifikasi pembayaran dan proses IMEI
4. IMEI aktif dan perangkat siap digunakan

ATURAN:
- Jawab dengan bahasa Indonesia yang ramah, sopan, dan ringkas.
- Jangan pernah menggunakan emoji.
- Jika ditanya hal di luar konteks BeliIMEI, arahkan pembicaraan kembali ke layanan.
- Jika pelanggan ingin order, arahkan ke halaman /order.
- Jika pelanggan ingin lacak pesanan, arahkan ke halaman /track.
- Jika pelanggan butuh bantuan lebih lanjut, arahkan ke WhatsApp admin.
- Jawaban maksimal 3 paragraf pendek. Langsung ke inti.`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ success: false, message: "Pesan tidak valid." }, { status: 400 });
    }

    const apiKey = await getSecret("ALIBABA_API_KEY");
    if (!apiKey) {
      return Response.json({
        success: false,
        message: "AI belum dikonfigurasi. Silakan hubungi admin.",
      }, { status: 500 });
    }

    // Get pricing for context
    const pricing = await getPricing();
    let servicesText = "";
    for (const [code, data] of Object.entries(pricing)) {
      const d = data as { name: string; sell_price: number };
      servicesText += `- ${d.name} (${code}): Rp ${d.sell_price.toLocaleString("id-ID")}\n`;
    }

    const systemPrompt = SYSTEM_PROMPT.replace("{SERVICES}", servicesText || "Informasi harga belum tersedia.");

    // Initialize OpenAI client pointing to Alibaba DashScope Intl
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    });

    const completion = await client.chat.completions.create({
      model: "qwen3.6-plus",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      max_tokens: 512,
      temperature: 0.7
    });

    const text = completion.choices[0]?.message?.content || "Maaf, saya tidak bisa menjawab saat ini. Silakan coba lagi.";

    return Response.json({ success: true, reply: text });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    
    const errMsg = error instanceof Error ? error.message : String(error);
    
    // Check for quota/rate limit errors
    if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("rate_limit")) {
      return Response.json({
        success: true,
        reply: "Mohon maaf, layanan AI kami sedang sibuk. Silakan coba lagi dalam beberapa menit, atau hubungi admin via WhatsApp untuk bantuan langsung.",
      });
    }

    return Response.json({
      success: false,
      message: "Terjadi kesalahan. Silakan coba lagi.",
    }, { status: 500 });
  }
}
