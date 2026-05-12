"use client";

import { useState, useEffect, use } from "react";
import { Star, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [info, setInfo] = useState<{ customer_name: string; order_id: string } | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews/${token}`).then((r) => r.json()).then((d) => {
      if (d.success) { setInfo(d); setName(d.customer_name || ""); }
      else setError(d.message || "Link tidak valid.");
    });
  }, [token]);

  const submit = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/reviews/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, comment }),
      });
      const d = await r.json();
      if (d.success) setDone(true);
      else setError(d.message);
    } catch { setError("Gagal mengirim testimoni."); }
    setLoading(false);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4"/>
          <h2 className="text-xl font-bold mb-2">Oops!</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4"/>
          <h2 className="text-xl font-bold mb-2">Terima Kasih!</h2>
          <p className="text-gray-600">Testimoni Anda telah dikirim. Terima kasih atas feedback-nya!</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32}/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 py-24 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-2 text-center">Beri Testimoni</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Bagikan pengalaman Anda menggunakan layanan kami</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="transition hover:scale-110">
                  <Star size={28} className={s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}/>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Komentar</label>
            <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ceritakan pengalaman Anda..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-none"/>
          </div>
          <button onClick={submit} disabled={loading || !name || !comment}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Mengirim..." : "Kirim Testimoni"}
          </button>
        </div>
      </div>
    </div>
  );
}
