import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import MaintenanceBlocker from "@/components/MaintenanceBlocker";
import { getLandingConfig } from "@/lib/redis";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BeliIMEI - Aktivasi IMEI Tanpa Ribet",
  description: "Layanan aktivasi IMEI terpercaya, cepat, dan aman. Roamer IMEI resmi dengan garansi.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getLandingConfig();
  const isMaintenance = config.maintenance_mode === "true";

  return (
    <html lang="id" className={`${outfit.className} scroll-smooth`}>
      <body className="min-h-[100dvh] bg-white text-gray-900 antialiased">
        <MaintenanceBlocker isMaintenance={isMaintenance}>
          {children}
          <WhatsAppWidget />
        </MaintenanceBlocker>
      </body>
    </html>
  );
}
