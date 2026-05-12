"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();
  const [dots, setDots] = useState("");

  // Periodically check if maintenance mode has been turned off
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/maintenance-status", { cache: "no-store" });
        const data = await res.json();
        if (!data.maintenance) {
          router.replace("/");
        }
      } catch {
        // ignore errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  // Animated dots for the "loading" feel
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-white to-violet-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-violet-100/40 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-lg">
        {/* Animated icon container */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 bg-primary/10 rounded-[2rem] animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="52"
              height="52"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          {/* Rotating ring */}
          <div className="absolute -inset-3 border-2 border-dashed border-primary/20 rounded-[2.5rem] animate-[spin_20s_linear_infinite]" />
        </div>

        {/* Main heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 mb-4">
          Sedang Dalam Perbaikan
        </h1>

        {/* Description */}
        <p className="text-zinc-500 text-base sm:text-lg leading-relaxed max-w-md mx-auto mb-10">
          Sistem kami sedang dalam pemeliharaan rutin untuk meningkatkan kualitas layanan. Halaman akan otomatis kembali normal setelah selesai.
        </p>

        {/* Status indicator */}
        <div className="inline-flex items-center gap-3 bg-white border border-zinc-200/60 rounded-full px-6 py-3 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <span className="text-sm text-zinc-600 font-medium">
            Sedang diperbaiki{dots}
          </span>
        </div>

        {/* Estimated info */}
        <p className="text-xs text-zinc-400 mt-8">
          Halaman ini akan otomatis refresh ketika maintenance selesai.
        </p>
      </div>
    </div>
  );
}
