"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function WhatsAppWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [waNumber, setWaNumber] = useState("6285213971757");
  const pathname = usePathname();

  useEffect(() => {
    // Fetch landing config
    fetch("/api/landing-config")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.config?.admin_wa) {
          const formatted = d.config.admin_wa.replace(/^0/, "62").replace(/\D/g, "");
          setWaNumber(formatted);
        }
      })
      .catch(() => {});

    // Small delay before showing to ensure smooth entry after page load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (pathname?.startsWith("/admin") || pathname === "/maintenance") return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="bg-white px-4 py-2 rounded-2xl shadow-lg border border-gray-100/50 text-sm font-medium text-gray-700 animate-bounce origin-bottom-right" style={{ animationDuration: '3s' }}>
        Butuh bantuan? Chat kami! 👋
        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b border-r border-gray-100/50 transform rotate-45"></div>
      </div>
      
      <Link
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-[0_8px_30px_rgb(34,197,94,0.3)] hover:shadow-[0_8px_30px_rgb(34,197,94,0.5)] transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 group-hover:opacity-40"></div>
        <MessageCircle size={28} className="relative z-10" />
      </Link>
    </div>
  );
}
