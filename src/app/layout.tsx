import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BeliIMEI - Aktivasi IMEI Tanpa Ribet",
  description: "Layanan aktivasi IMEI terpercaya, cepat, dan aman. Roamer IMEI resmi dengan garansi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.className} scroll-smooth`}>
      <body className="min-h-screen bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
