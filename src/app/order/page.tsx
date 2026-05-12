"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle, CreditCard, QrCode, Building2, Loader2 } from "lucide-react";

interface Service { code: string; name: string; sell_price: number }
interface PaymentMethod { id: string; type: string; label: string; bank_name?: string; account_number?: string; account_name?: string; qris_string?: string }

export default function OrderPage() {
  const [services, setServices] = useState<Record<string, Service>>({});
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [form, setForm] = useState({ name: "", whatsapp: "", imei: "", service: "status" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; order_id?: string; message: string } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [qrisString, setQrisString] = useState("");
  const [isEligible, setIsEligible] = useState(false);
  const [checkingImei, setCheckingImei] = useState(false);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((d) => { if (d.success) setServices(d.services); });
    fetch("/api/payment-methods").then((r) => r.json()).then((d) => { if (d.success) setPaymentMethods(d.methods); });
  }, []);

  useEffect(() => {
    const checkEligibility = async () => {
      if (form.imei.length >= 14) {
        setCheckingImei(true);
        try {
          const r = await fetch(`/api/check-eligibility?imei=${form.imei}`);
          const d = await r.json();
          setIsEligible(d.eligible);
          if (d.eligible && form.service === "status") {
             // If eligible, switch them off status to roamer automatically
             setForm(prev => ({ ...prev, service: "roamer" }));
          } else if (!d.eligible) {
             setForm(prev => ({ ...prev, service: "status" }));
          }
        } catch {
          setIsEligible(false);
        }
        setCheckingImei(false);
      } else {
        setIsEligible(false);
        setForm(prev => ({ ...prev, service: "status" }));
      }
    };
    const timeoutId = setTimeout(checkEligibility, 500);
    return () => clearTimeout(timeoutId);
  }, [form.imei]);

  const selectedPrice = services[form.service]?.sell_price || 0;

  const loadQris = useCallback(async (amount: number) => {
    if (!amount) return;
    try {
      const r = await fetch(`/api/qris?amount=${amount}`);
      const d = await r.json();
      if (d.success) setQrisString(d.qris);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const pm = paymentMethods.find((m) => m.id === selectedPayment);
    if (pm?.type === "qris" && selectedPrice) loadQris(selectedPrice);
  }, [selectedPayment, selectedPrice, paymentMethods, loadQris]);

  const submit = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      setResult(d);
    } catch { setResult({ success: false, message: "Gagal mengirim pesanan." }); }
    setLoading(false);
  };

  const confirmPayment = async () => {
    if (!result?.order_id) return;
    setConfirming(true);
    try {
      const fd = new FormData();
      const pm = paymentMethods.find((m) => m.id === selectedPayment);
      fd.append("payment_method", pm?.type || "qris");
      if (proofFile) fd.append("proof", proofFile);
      await fetch(`/api/order/${result.order_id}/paid`, { method: "POST", body: fd });
      setPaymentConfirmed(true);
    } catch { /* ignore */ }
    setConfirming(false);
  };

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4"/>
          <h2 className="text-2xl font-bold mb-2">Pembayaran Dikonfirmasi!</h2>
          <p className="text-gray-600 mb-2">Order ID: <strong>{result?.order_id}</strong></p>
          <p className="text-gray-500 text-sm mb-6">Admin akan memproses pesanan Anda. Anda bisa melacak status pesanan kapan saja.</p>
          <div className="flex gap-3 justify-center">
            <Link href={`/track?id=${result?.order_id}`} className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition">Lacak Pesanan</Link>
            <Link href="/" className="border border-gray-200 px-6 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition">Kembali</Link>
          </div>
        </div>
      </div>
    );
  }

  if (result?.success) {
    const pm = paymentMethods.find((m) => m.id === selectedPayment);
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 py-24 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4"/>
            <h2 className="text-2xl font-bold text-center mb-2">Pesanan Berhasil!</h2>
            <p className="text-gray-600 text-center mb-6">Order ID: <strong className="text-primary">{result.order_id}</strong></p>

            <h3 className="font-semibold text-gray-900 mb-3">Pilih Metode Pembayaran</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {paymentMethods.map((m) => (
                <button key={m.id} onClick={() => setSelectedPayment(m.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition ${selectedPayment === m.id ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"}`}>
                  {m.type === "qris" ? <QrCode size={20} className="text-primary"/> : <Building2 size={20} className="text-blue-600"/>}
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              ))}
            </div>

            {pm && (
              <div className="bg-gray-50 rounded-xl p-5 mb-6">
                {pm.type === "qris" && qrisString && (
                  <div className="text-center">
                    <p className="text-sm font-semibold mb-3">Scan QRIS untuk membayar</p>
                    <div className="bg-white p-4 rounded-xl inline-block mb-2">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrisString)}`} alt="QRIS" className="w-48 h-48"/>
                    </div>
                    <p className="text-lg font-bold text-primary">Rp {selectedPrice.toLocaleString("id-ID")}</p>
                  </div>
                )}
                {pm.type === "bank" && (
                  <div>
                    <p className="text-sm font-semibold mb-3">Transfer ke rekening berikut:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{pm.bank_name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">No. Rekening</span><span className="font-mono font-medium">{pm.account_number}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Atas Nama</span><span className="font-medium">{pm.account_name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Jumlah</span><span className="font-bold text-primary">Rp {selectedPrice.toLocaleString("id-ID")}</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedPayment && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Bukti Pembayaran</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-primary/50 transition bg-gray-50">
                    <Upload size={24} className="text-gray-400 mb-2"/>
                    <span className="text-sm text-gray-500">{proofFile ? proofFile.name : "Klik untuk upload (JPG, PNG, PDF - Max 5MB)"}</span>
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setProofFile(e.target.files?.[0] || null)}/>
                  </label>
                </div>
                <button onClick={confirmPayment} disabled={confirming || !proofFile}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {confirming ? <><Loader2 size={18} className="animate-spin"/> Mengirim...</> : <><CreditCard size={18}/> Saya Sudah Bayar</>}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filter services based on eligibility
  const serviceList = Object.values(services).filter((svc) => {
    if (svc.code === "status") return !isEligible;
    return isEligible;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 py-24 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-6 transition">
          <ArrowLeft size={16}/> Kembali
        </Link>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Pesan Layanan IMEI</h1>
          {result && !result.success && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-4">{result.message}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">IMEI</label>
              <div className="relative">
                <input type="text" maxLength={16} placeholder="Masukkan 15 digit IMEI" value={form.imei}
                  onChange={(e) => setForm({ ...form, imei: e.target.value.replace(/\D/g, "") })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"/>
                {checkingImei && (
                  <div className="absolute right-3 top-3 text-primary">
                    <Loader2 size={18} className="animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Masukkan IMEI untuk melihat layanan yang tersedia.</p>
            </div>
            {form.imei.length >= 14 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Layanan</label>
                {!isEligible && !checkingImei && (
                  <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-xl mb-3 border border-amber-100">
                    Sistem mendeteksi IMEI Anda belum di-cek statusnya di CEIR, atau statusnya bukan UNKNOWN. Anda harus memesan layanan Cek Status CEIR terlebih dahulu.
                  </div>
                )}
                {isEligible && !checkingImei && (
                  <div className="bg-green-50 text-green-800 text-xs p-3 rounded-xl mb-3 border border-green-100">
                    IMEI Anda eligible (UNKNOWN). Silakan pilih paket aktivasi Roamer.
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3">
                  {serviceList.map((svc) => (
                    <button key={svc.code} onClick={() => setForm({ ...form, service: svc.code })}
                      className={`text-left p-4 rounded-xl border-2 transition ${form.service === svc.code ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"}`}>
                      <div className="font-semibold text-gray-900">{svc.name}</div>
                      <div className="text-primary font-bold mt-1">Rp {svc.sell_price.toLocaleString("id-ID")}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" placeholder="Nama Anda" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor WhatsApp</label>
              <input type="text" placeholder="08xxxxxxxxxx" value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"/>
            </div>
            <button onClick={submit} disabled={loading || !form.service || !form.imei || !form.name || !form.whatsapp}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={18} className="animate-spin"/> Mengirim...</> : "Kirim Pesanan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
