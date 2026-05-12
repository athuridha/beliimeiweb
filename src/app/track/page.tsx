"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Search, CheckCircle, Clock, AlertCircle, Loader2, Package } from "lucide-react";

interface Step { label: string; time: string | null; done: boolean }
interface TrackData {
  order: { id: string; service: string; status: string; imei: string; createdAt: string; result: unknown };
  steps: Step[];
}

function TrackContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("id") || "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) { setOrderId(id); doTrack(id); }
  }, [searchParams]);

  const doTrack = async (id?: string) => {
    const searchId = (id || orderId).trim().toUpperCase();
    if (!searchId) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const r = await fetch(`/api/track/${searchId}`);
      const d = await r.json();
      if (d.success) setData(d);
      else setError(d.message || "Pesanan tidak ditemukan.");
    } catch { setError("Gagal mengambil data."); }
    setLoading(false);
  };

  const statusColor = (s: string) => {
    if (s === "completed") return "text-green-600 bg-green-50";
    if (s === "failed") return "text-red-600 bg-red-50";
    if (s === "processing" || s === "waiting") return "text-amber-600 bg-amber-50";
    return "text-gray-600 bg-gray-50";
  };

  const statusIcon = (s: string) => {
    if (s === "completed") return <CheckCircle size={20}/>;
    if (s === "failed") return <AlertCircle size={20}/>;
    if (s === "processing" || s === "waiting") return <Clock size={20}/>;
    return <Package size={20}/>;
  };

  const statusLabel = (s: string) => {
    const m: Record<string, string> = { pending: "Menunggu", processing: "Diproses", waiting: "Menunggu Hasil", completed: "Selesai", failed: "Gagal" };
    return m[s] || s;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 py-24 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-6 transition">
          <ArrowLeft size={16}/> Kembali
        </Link>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Lacak Pesanan</h1>
          <div className="flex gap-2 mb-6">
            <input type="text" placeholder="Masukkan Order ID (contoh: BELIIMEI-12345678)" value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doTrack()}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"/>
            <button onClick={() => doTrack()} disabled={loading}
              className="bg-primary text-white px-5 rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin"/> : <Search size={18}/>}
            </button>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

          {data && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-bold text-lg">{data.order.id}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusColor(data.order.status)}`}>
                  {statusIcon(data.order.status)} {statusLabel(data.order.status)}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Layanan</span><span className="font-medium">{data.order.service}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">IMEI</span><span className="font-mono">{data.order.imei}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tanggal</span><span>{new Date(data.order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-0">
                {data.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${step.done ? "bg-primary" : "bg-gray-200"} ring-4 ${step.done ? "ring-primary/20" : "ring-gray-100"}`}/>
                      {i < data.steps.length - 1 && <div className={`w-0.5 h-8 ${step.done ? "bg-primary/30" : "bg-gray-200"}`}/>}
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm font-medium ${step.done ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                      {step.time && <p className="text-xs text-gray-400 mt-0.5">{new Date(step.time).toLocaleString("id-ID")}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {data.order.result != null && data.order.status === "completed" && (
                <div className="mt-4 bg-green-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-green-800 mb-1">Hasil</p>
                  <pre className="text-xs text-green-700 whitespace-pre-wrap overflow-auto">{typeof data.order.result === "string" ? data.order.result : JSON.stringify(data.order.result as Record<string, unknown>, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32}/></div>}><TrackContent/></Suspense>;
}
