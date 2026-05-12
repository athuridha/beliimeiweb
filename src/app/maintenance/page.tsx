import { Wrench } from "lucide-react";
import { getLandingConfig } from "@/lib/redis";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sedang Dalam Perbaikan - BeliIMEI",
};

export default async function MaintenancePage() {
  const config = await getLandingConfig();
  if (config.maintenance_mode !== "true") {
    redirect("/");
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
        <Wrench size={48} className="text-primary" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
        Sedang Dalam Perbaikan
      </h1>
      <p className="text-gray-500 max-w-md text-lg">
        Sistem kami saat ini sedang dalam pemeliharaan rutin untuk meningkatkan kualitas layanan. Silakan kembali beberapa saat lagi.
      </p>
    </div>
  );
}
