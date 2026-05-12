"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, ShoppingCart, Layers, MessageSquare, CreditCard, Globe,
  Wrench, Settings, LogOut, Eye, EyeOff, Trash2, Play, RefreshCw,
  Copy, Search, ChevronDown, Plus, ExternalLink, Loader2, X, Check, Menu
} from "lucide-react";

// ====== TYPES ======
interface Order {
  id: string; name: string; whatsapp: string; service: string; imei: string;
  price: number; status: string; result: unknown; apiOrderId: string | null;
  createdAt: string; processedAt: string | null;
  payment_method?: string; payment_proof?: string;
}
interface Testimonial { id: string; name: string; rating: number; comment: string; visible: boolean; createdAt: string; order_id?: string }
interface PaymentMethod { id: string; type: string; label: string; enabled: boolean; bank_name?: string; account_number?: string; account_name?: string; qris_string?: string }
interface PricingData { [code: string]: { sell_price: number; name: string } }
interface ApiPrices { [code: string]: { name: string; price: number } }

// ====== AUTH HELPER ======
function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ====== LOGIN COMPONENT ======
function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const d = await r.json();
      if (d.success) { localStorage.setItem("admin_token", d.token); onLogin(d.token); }
      else setError(d.message);
    } catch { setError("Gagal login."); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-1">Admin Panel</h1>
        <p className="text-gray-500 text-sm text-center mb-6">BeliIMEI Dashboard</p>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-4">{error}</div>}
        <div className="space-y-4">
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
          <button onClick={submit} disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-50">
            {loading ? "Loading..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== SIDEBAR ======
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Pesanan", icon: ShoppingCart },
  { id: "services", label: "Layanan", icon: Layers },
  { id: "testimonials", label: "Testimoni", icon: MessageSquare },
  { id: "payments", label: "Pembayaran", icon: CreditCard },
  { id: "landing", label: "Landing Page", icon: Globe },
  { id: "api-tools", label: "API Tools", icon: Wrench },
  { id: "settings", label: "Pengaturan", icon: Settings },
];

function Sidebar({ active, setActive, pendingCount, onLogout }: { active: string; setActive: (t: string) => void; pendingCount: number; onLogout: () => void }) {
  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col min-h-screen shrink-0">
      <div className="p-5 border-b border-slate-800">
        <h2 className="font-bold text-lg">BeliIMEI</h2>
        <p className="text-xs text-slate-400">Admin Panel</p>
      </div>
      <nav className="flex-1 py-3 space-y-0.5 px-3">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active === t.id ? "bg-primary text-white shadow-md shadow-primary/30" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
            <t.icon size={18}/>
            <span className="flex-1 text-left">{t.label}</span>
            {t.id === "orders" && pendingCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-800">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition">
          <LogOut size={18}/> Keluar
        </button>
      </div>
    </aside>
  );
}

// ====== DASHBOARD TAB ======
function DashboardTab({ orders, token }: { orders: Order[]; token: string }) {
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/admin/balance", { headers: authHeaders(token) }).then((r) => r.json()).then((d) => { if (d.success) setBalance(d.balance); });
  }, [token]);

  const total = orders.length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const processing = orders.filter((o) => ["processing", "waiting"].includes(o.status)).length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const failed = orders.filter((o) => o.status === "failed").length;
  const revenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + (o.price || 0), 0);

  const cards = [
    { label: "Total Pesanan", value: total, color: "border-blue-500" },
    { label: "Pesanan Baru", value: pending, color: "border-amber-500" },
    { label: "Dalam Proses", value: processing, color: "border-cyan-500" },
    { label: "Berhasil", value: completed, color: "border-green-500" },
    { label: "Gagal", value: failed, color: "border-red-500" },
    { label: "Total Pendapatan", value: `Rp ${revenue.toLocaleString("id-ID")}`, color: "border-emerald-500" },
    { label: "Saldo API", value: balance !== null ? `Rp ${balance.toLocaleString("id-ID")}` : "Loading...", color: "border-purple-500" },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${c.color}`}>
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold mb-4">Pesanan Terbaru</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500"><th className="pb-2 pr-4">ID</th><th className="pb-2 pr-4">Nama</th><th className="pb-2 pr-4">IMEI</th><th className="pb-2 pr-4">Status</th><th className="pb-2">Tanggal</th></tr></thead>
            <tbody>
              {orders.slice(0, 10).map((o) => (
                <tr key={o.id} className="border-b border-gray-50">
                  <td className="py-2.5 pr-4 font-mono text-primary font-medium">{o.id}</td>
                  <td className="py-2.5 pr-4">{o.name}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{o.imei}</td>
                  <td className="py-2.5 pr-4"><StatusBadge status={o.status}/></td>
                  <td className="py-2.5 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700", processing: "bg-blue-50 text-blue-700",
    waiting: "bg-cyan-50 text-cyan-700", completed: "bg-green-50 text-green-700", failed: "bg-red-50 text-red-700",
  };
  const labels: Record<string, string> = { pending: "Pending", processing: "Proses", waiting: "Menunggu", completed: "Selesai", failed: "Gagal" };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${m[status] || "bg-gray-50 text-gray-700"}`}>{labels[status] || status}</span>;
}

// ====== ORDERS TAB ======
function OrdersTab({ orders, token, refresh }: { orders: Order[]; token: string; refresh: () => void }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [detail, setDetail] = useState<Order | null>(null);
  const [processing, setProcessing] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ name: "", whatsapp: "", imei: "", service: "status", price: "", status: "pending", notify: false });
  const [manualLoading, setManualLoading] = useState(false);

  const filtered = orders.filter((o) => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.id.toLowerCase().includes(q) || o.name.toLowerCase().includes(q) || o.imei.includes(q);
    }
    return true;
  });

  const submitManual = async () => {
    setManualLoading(true);
    const r = await fetch("/api/admin/orders", { method: "POST", headers: authHeaders(token), body: JSON.stringify(manualForm) });
    const d = await r.json();
    if (d.success) {
      setShowManual(false);
      setManualForm({ name: "", whatsapp: "", imei: "", service: "status", price: "", status: "pending", notify: false });
      refresh();
    } else {
      alert(d.message || "Gagal membuat pesanan");
    }
    setManualLoading(false);
  };

  const processOrder = async (id: string) => {
    setProcessing(id);
    await fetch(`/api/admin/process/${id}`, { method: "POST", headers: authHeaders(token) });
    refresh();
    setProcessing("");
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Hapus pesanan ini?")) return;
    await fetch(`/api/admin/orders/${id}`, { method: "DELETE", headers: authHeaders(token) });
    refresh();
  };

  const checkStatus = async (id: string) => {
    setProcessing(id);
    await fetch(`/api/admin/check-status/${id}`, { method: "POST", headers: authHeaders(token) });
    refresh();
    setProcessing("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Pesanan</h2>
        <button onClick={() => setShowManual(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition">
          <Plus size={16}/> Pesanan Manual
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400"/>
          <input type="text" placeholder="Cari order ID, nama, IMEI..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
          <option value="all">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Diproses</option>
          <option value="waiting">Menunggu</option>
          <option value="completed">Selesai</option>
          <option value="failed">Gagal</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500 bg-gray-50">
            <th className="p-3">Order ID</th><th className="p-3">Nama / WA</th><th className="p-3">IMEI</th>
            <th className="p-3">Layanan</th><th className="p-3">Harga</th><th className="p-3">Status</th>
            <th className="p-3">Tanggal</th><th className="p-3">Aksi</th>
          </tr></thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-primary font-medium">{o.id}</span>
                    <button onClick={() => navigator.clipboard.writeText(o.id)} className="text-gray-300 hover:text-gray-500"><Copy size={12}/></button>
                  </div>
                </td>
                <td className="p-3"><div className="font-medium">{o.name}</div><div className="text-xs text-gray-400">{o.whatsapp}</div></td>
                <td className="p-3 font-mono text-xs">{o.imei}</td>
                <td className="p-3 text-xs">{o.service}</td>
                <td className="p-3 font-medium">Rp {(o.price || 0).toLocaleString("id-ID")}</td>
                <td className="p-3"><StatusBadge status={o.status}/></td>
                <td className="p-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString("id-ID")}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setDetail(o)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Detail"><Eye size={14}/></button>
                    {o.status === "pending" && <button onClick={() => processOrder(o.id)} disabled={processing === o.id} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Proses">{processing === o.id ? <Loader2 size={14} className="animate-spin"/> : <Play size={14}/>}</button>}
                    {o.status === "waiting" && <button onClick={() => checkStatus(o.id)} disabled={processing === o.id} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Cek Status">{processing === o.id ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}</button>}
                    <a href={`https://wa.me/${o.whatsapp.replace(/^0/, "62")}`} target="_blank" className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="WhatsApp"><ExternalLink size={14}/></a>
                    <button onClick={() => deleteOrder(o.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Hapus"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div className="p-8 text-center text-gray-400">Tidak ada pesanan</div>}
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Detail Pesanan {detail.id}</h3>
              <button onClick={() => setDetail(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18}/></button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["Nama", detail.name], ["WhatsApp", detail.whatsapp], ["IMEI", detail.imei],
                ["Layanan", detail.service], ["Harga", `Rp ${(detail.price || 0).toLocaleString("id-ID")}`],
                ["Status", detail.status], ["Tanggal", new Date(detail.createdAt).toLocaleString("id-ID")],
                ["Metode Bayar", detail.payment_method || "-"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-500">{k}</span><span className="font-medium">{v}</span></div>
              ))}
            </div>
            

            {detail.payment_proof && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Bukti Pembayaran:</p>
                <img src={detail.payment_proof} alt="Bukti" className="rounded-xl max-h-64 object-contain border"/>
              </div>
            )}
            {detail.result != null && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Hasil:</p>
                <pre className="bg-gray-900 text-green-400 p-3 rounded-xl text-xs overflow-auto max-h-48">{typeof detail.result === "string" ? detail.result : JSON.stringify(detail.result as Record<string, unknown>, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {showManual && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowManual(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Buat Pesanan Manual</h3>
              <button onClick={() => setShowManual(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18}/></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Nama Customer" value={manualForm.name} onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
              <input type="text" placeholder="WhatsApp (opsional)" value={manualForm.whatsapp} onChange={(e) => setManualForm({ ...manualForm, whatsapp: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
              <input type="text" placeholder="IMEI" value={manualForm.imei} onChange={(e) => setManualForm({ ...manualForm, imei: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
              <select value={manualForm.service} onChange={(e) => setManualForm({ ...manualForm, service: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                <option value="status">Cek Status (Kemenperin)</option>
                <option value="history">Cek History (Apple)</option>
                <option value="roamer">Roamer (Pending)</option>
                <option value="roamer_instant">Roamer (Instant)</option>
              </select>
              <input type="number" placeholder="Harga (Kosongkan utk harga default)" value={manualForm.price} onChange={(e) => setManualForm({ ...manualForm, price: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
              <select value={manualForm.status} onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                <option value="pending">Pending</option>
                <option value="processing">Diproses</option>
                <option value="waiting">Menunggu</option>
                <option value="completed">Selesai</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                <input type="checkbox" checked={manualForm.notify} onChange={(e) => setManualForm({ ...manualForm, notify: e.target.checked })} className="rounded text-primary focus:ring-primary"/>
                Kirim Notifikasi WA ke Customer (Jika pending)
              </label>
              <button onClick={submitManual} disabled={manualLoading || !manualForm.imei} className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50 mt-2">
                {manualLoading ? "Menyimpan..." : "Buat Pesanan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====== SERVICES TAB ======
function ServicesTab({ token }: { token: string }) {
  const [pricing, setPricing] = useState<PricingData>({});
  const [apiPrices, setApiPrices] = useState<ApiPrices>({});
  const [edited, setEdited] = useState<Record<string, number>>({});
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/pricing", { headers: authHeaders(token) });
    const d = await r.json();
    if (d.success) { setPricing(d.pricing); setApiPrices(d.api_prices); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const syncPrices = async () => {
    setSyncing(true);
    await fetch("/api/admin/sync-prices", { method: "POST", headers: authHeaders(token) });
    await load();
    setSyncing(false);
  };

  const savePricing = async () => {
    setSaving(true);
    const body: Record<string, { sell_price: number }> = {};
    for (const [code, price] of Object.entries(edited)) body[code] = { sell_price: price };
    await fetch("/api/admin/pricing", { method: "POST", headers: authHeaders(token), body: JSON.stringify(body) });
    await load();
    setEdited({});
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Layanan</h2>
        <button onClick={syncPrices} disabled={syncing} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
          {syncing ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>} Sync Harga API
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500 bg-gray-50">
            <th className="p-3">Layanan</th><th className="p-3">Harga Jual</th><th className="p-3">Biaya API</th><th className="p-3">Profit</th>
          </tr></thead>
          <tbody>
            {Object.entries(pricing).map(([code, p]) => {
              const apiPrice = apiPrices[code]?.price || 0;
              const sellPrice = edited[code] ?? p.sell_price;
              const profit = sellPrice - apiPrice;
              return (
                <tr key={code} className="border-b border-gray-50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">
                    <input type="number" value={sellPrice} onChange={(e) => setEdited({ ...edited, [code]: parseInt(e.target.value) || 0 })}
                      className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
                  </td>
                  <td className="p-3 text-gray-500">Rp {apiPrice.toLocaleString("id-ID")}</td>
                  <td className={`p-3 font-semibold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>Rp {profit.toLocaleString("id-ID")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {Object.keys(edited).length > 0 && (
        <div className="mt-4 flex justify-end">
          <button onClick={savePricing} disabled={saving} className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
            {saving ? "Menyimpan..." : "Simpan Harga"}
          </button>
        </div>
      )}
    </div>
  );
}

// ====== TESTIMONIALS TAB ======
function TestimonialsTab({ token }: { token: string }) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [genOrderId, setGenOrderId] = useState("");
  const [genName, setGenName] = useState("");
  const [genLink, setGenLink] = useState("");
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/testimonials", { headers: authHeaders(token) });
    const d = await r.json();
    if (d.success) setItems(d.testimonials);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    const r = await fetch("/api/admin/testimonials", { method: "POST", headers: authHeaders(token), body: JSON.stringify({ order_id: genOrderId, customer_name: genName }) });
    const d = await r.json();
    if (d.success) setGenLink(`${window.location.origin}${d.link}`);
    setGenerating(false);
  };

  const toggleVis = async (id: string) => {
    await fetch(`/api/admin/testimonials/${id}/toggle`, { method: "POST", headers: authHeaders(token) });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus testimoni ini?")) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE", headers: authHeaders(token) });
    load();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Testimoni</h2>
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h3 className="font-semibold mb-3">Generate Link Review</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Order ID (opsional)" value={genOrderId} onChange={(e) => setGenOrderId(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm flex-1 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
          <input type="text" placeholder="Nama customer (opsional)" value={genName} onChange={(e) => setGenName(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm flex-1 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
          <button onClick={generate} disabled={generating} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition whitespace-nowrap disabled:opacity-50">
            {generating ? "Generating..." : "Generate Link"}
          </button>
        </div>
        {genLink && (
          <div className="mt-3 flex items-center gap-2 bg-green-50 p-3 rounded-xl">
            <input type="text" value={genLink} readOnly className="flex-1 bg-transparent text-sm text-green-800 outline-none font-mono"/>
            <button onClick={() => navigator.clipboard.writeText(genLink)} className="text-green-700 hover:text-green-900"><Copy size={16}/></button>
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500 bg-gray-50">
            <th className="p-3">Nama</th><th className="p-3">Rating</th><th className="p-3">Komentar</th><th className="p-3">Visible</th><th className="p-3">Aksi</th>
          </tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-b border-gray-50">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</td>
                <td className="p-3 text-gray-600 max-w-xs truncate">{t.comment}</td>
                <td className="p-3"><button onClick={() => toggleVis(t.id)} className={t.visible !== false ? "text-green-600" : "text-gray-400"}>{t.visible !== false ? <Eye size={16}/> : <EyeOff size={16}/>}</button></td>
                <td className="p-3"><button onClick={() => remove(t.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <div className="p-8 text-center text-gray-400">Belum ada testimoni</div>}
      </div>
    </div>
  );
}

// ====== PAYMENTS TAB ======
function PaymentsTab({ token }: { token: string }) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState("bank");
  const [addForm, setAddForm] = useState({ label: "", bank_name: "", account_number: "", account_name: "", qris_string: "" });

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/payment-methods", { headers: authHeaders(token) });
    const d = await r.json();
    if (d.success) setMethods(d.methods);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    await fetch("/api/admin/payment-methods", { method: "POST", headers: authHeaders(token), body: JSON.stringify({ type: addType, ...addForm }) });
    setShowAdd(false);
    setAddForm({ label: "", bank_name: "", account_number: "", account_name: "", qris_string: "" });
    load();
  };

  const toggle = async (m: PaymentMethod) => {
    await fetch(`/api/admin/payment-methods/${m.id}/update`, { method: "POST", headers: authHeaders(token), body: JSON.stringify({ enabled: !m.enabled }) });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus metode pembayaran ini?")) return;
    await fetch(`/api/admin/payment-methods/${id}`, { method: "DELETE", headers: authHeaders(token) });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Pembayaran</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition">
          <Plus size={16}/> Tambah Metode
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {methods.map((m) => (
          <div key={m.id} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${m.enabled ? "border-green-500" : "border-gray-300"}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.type === "qris" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{m.type.toUpperCase()}</span>
                <h3 className="font-semibold mt-1">{m.label}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(m)} className={`p-1.5 rounded-lg ${m.enabled ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}>{m.enabled ? <Check size={16}/> : <X size={16}/>}</button>
                <button onClick={() => remove(m.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14}/></button>
              </div>
            </div>
            {m.type === "bank" && (
              <div className="text-sm text-gray-500 space-y-0.5">
                <p>Bank: {m.bank_name}</p><p>No. Rek: {m.account_number}</p><p>A/N: {m.account_name}</p>
              </div>
            )}
            {m.type === "qris" && <p className="text-xs text-gray-400 truncate">QRIS: {m.qris_string || "Default"}</p>}
          </div>
        ))}
      </div>
      {!methods.length && <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">Belum ada metode pembayaran</div>}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Tambah Metode Pembayaran</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                {["bank", "qris"].map((t) => (
                  <button key={t} onClick={() => setAddType(t)} className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition ${addType === t ? "border-primary bg-primary/5 text-primary" : "border-gray-200"}`}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Label (contoh: BCA, QRIS GoPay)" value={addForm.label} onChange={(e) => setAddForm({ ...addForm, label: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
              {addType === "bank" && <>
                <input type="text" placeholder="Nama Bank" value={addForm.bank_name} onChange={(e) => setAddForm({ ...addForm, bank_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
                <input type="text" placeholder="Nomor Rekening" value={addForm.account_number} onChange={(e) => setAddForm({ ...addForm, account_number: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
                <input type="text" placeholder="Atas Nama" value={addForm.account_name} onChange={(e) => setAddForm({ ...addForm, account_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
              </>}
              {addType === "qris" && (
                <textarea placeholder="QRIS String (kosongkan untuk pakai default)" value={addForm.qris_string} onChange={(e) => setAddForm({ ...addForm, qris_string: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" rows={3}/>
              )}
              <button onClick={add} disabled={!addForm.label} className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">Tambah</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====== LANDING PAGE TAB ======
function LandingTab({ token }: { token: string }) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/landing-config", { headers: authHeaders(token) }).then((r) => r.json()).then((d) => { if (d.success) setConfig(d.config); });
  }, [token]);

  const save = async () => {
    setSaving(true);
    await fetch("/api/admin/landing-config", { method: "POST", headers: authHeaders(token), body: JSON.stringify(config) });
    setSaving(false);
  };

  const fields = [
    { key: "hero_title", label: "Hero Title", placeholder: "Aktivasi IMEI Tanpa Ribet." },
    { key: "hero_subtitle", label: "Hero Subtitle", placeholder: "Layanan roamer IMEI resmi, cepat, dan aman." },
    { key: "hero_badge", label: "Hero Badge", placeholder: "Trusted by 500+ customers" },
    { key: "testi_title", label: "Judul Testimoni", placeholder: "Kata Mereka" },
    { key: "admin_wa", label: "Nomor WhatsApp Admin", placeholder: "085213971757" },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Landing Page</h2>
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <input type="checkbox" id="maintenance" checked={config.maintenance_mode === "true"} 
            onChange={(e) => setConfig({ ...config, maintenance_mode: e.target.checked ? "true" : "false" })}
            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer" />
          <label htmlFor="maintenance" className="font-semibold text-amber-900 select-none cursor-pointer">
            Aktifkan Maintenance Mode (Tutup Sementara Seluruh Layanan)
          </label>
        </div>
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{f.label}</label>
            <input type="text" placeholder={f.placeholder} value={config[f.key] || ""} onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
          </div>
        ))}
        <button onClick={save} disabled={saving} className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}

// ====== API TOOLS TAB ======
function ApiToolsTab({ token }: { token: string }) {
  const [apiPrices, setApiPrices] = useState<ApiPrices>({});

  useEffect(() => {
    fetch("/api/admin/api-tools/services-list", { method: "POST", headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => {
        if (d.status === true && d.data && d.data.services) {
          const prices: ApiPrices = {};
          for (const s of d.data.services) {
            prices[s.code] = { name: s.name, price: s.price };
          }
          setApiPrices(prices);
        }
      });
  }, [token]);

  const getCost = (code: string, fallback: string) => {
    return apiPrices[code] ? `Rp ${apiPrices[code].price.toLocaleString("id-ID")}` : fallback;
  };

  const tools = [
    { id: "auth", label: "Verifikasi API", endpoint: "POST /auth", cost: "Gratis" },
    { id: "services-list", label: "Daftar Layanan", endpoint: "POST /services", cost: "Gratis" },
    { id: "order-status", label: "Cek Status", endpoint: "POST /order (status)", cost: getCost("status", "Rp 3.000") },
    { id: "order-history", label: "Cek History", endpoint: "POST /order (history)", cost: getCost("history", "Rp 5.000") },
    { id: "ceir-status", label: "Status Order CEIR", endpoint: "GET /status", cost: "Gratis" },
    { id: "roamer-add", label: "Roamer (Pending)", endpoint: "POST /roamer/add", cost: getCost("roamer", "Rp 95.000") },
    { id: "roamer-instant", label: "Roamer Instant", endpoint: "POST /roamer/instant", cost: getCost("roamer_instant", "Rp 95.000") },
    { id: "roamer-status", label: "Status Roamer", endpoint: "GET /roamer/status", cost: "Gratis" },
  ];
  const [active, setActive] = useState("auth");
  const [imei, setImei] = useState("");
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setResult(null);
    const h = authHeaders(token);
    try {
      let r;
      switch (active) {
        case "auth":
          r = await fetch("/api/admin/api-tools/auth", { method: "POST", headers: h });
          break;
        case "services-list":
          r = await fetch("/api/admin/api-tools/services-list", { method: "POST", headers: h });
          break;
        case "order-status":
          r = await fetch("/api/admin/api-tools/order-ceir", { method: "POST", headers: h, body: JSON.stringify({ service: "status", imei }) });
          break;
        case "order-history":
          r = await fetch("/api/admin/api-tools/order-ceir", { method: "POST", headers: h, body: JSON.stringify({ service: "history", imei }) });
          break;
        case "ceir-status":
          r = await fetch(`/api/admin/api-tools/ceir-status?order_id=${orderId}`, { headers: h });
          break;
        case "roamer-add":
          r = await fetch("/api/admin/api-tools/roamer-add", { method: "POST", headers: h, body: JSON.stringify({ imei, months: 3 }) });
          break;
        case "roamer-instant":
          r = await fetch("/api/admin/api-tools/roamer-instant", { method: "POST", headers: h, body: JSON.stringify({ imei }) });
          break;
        case "roamer-status":
          r = await fetch(`/api/admin/api-tools/roamer-status?order_id=${orderId}`, { headers: h });
          break;
      }
      if (r) setResult(await r.json());
    } catch (e) { setResult({ error: String(e) }); }
    setLoading(false);
  };

  const tool = tools.find((t) => t.id === active);
  const needsImei = ["order-status", "order-history", "roamer-add", "roamer-instant"].includes(active);
  const needsOrderId = ["ceir-status", "roamer-status"].includes(active);

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">API Tools</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {tools.map((t) => (
          <button key={t.id} onClick={() => { setActive(t.id); setResult(null); }}
            className={`p-3 rounded-xl border-2 text-left transition ${active === t.id ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200 bg-white"}`}>
            <p className="text-sm font-medium">{t.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.cost}</p>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">{tool?.label}</h3>
            <p className="text-xs text-gray-400">{tool?.endpoint}</p>
          </div>
          <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">{tool?.cost}</span>
        </div>
        {needsImei && (
          <input type="text" placeholder="IMEI (15 digit)" value={imei} onChange={(e) => setImei(e.target.value.replace(/\D/g, ""))} maxLength={16}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
        )}
        {needsOrderId && (
          <input type="text" placeholder="Order ID (contoh: CEKCEIR-STATUS-2551)" value={orderId} onChange={(e) => setOrderId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
        )}
        <button onClick={run} disabled={loading || (needsImei && imei.length < 14) || (needsOrderId && !orderId)}
          className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50 flex items-center gap-2">
          {loading ? <><Loader2 size={16} className="animate-spin"/> Menjalankan...</> : <><Play size={16}/> Jalankan</>}
        </button>
        {result != null && (
          <div className="mt-4">
            <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-auto max-h-96 whitespace-pre-wrap">{JSON.stringify(result as Record<string, unknown>, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ====== SETTINGS TAB ======
function SettingsTab({ token }: { token: string }) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const changePw = async () => {
    setSaving(true); setMsg("");
    const r = await fetch("/api/admin/change-password", { method: "POST", headers: authHeaders(token), body: JSON.stringify({ old_password: oldPw, new_password: newPw }) });
    const d = await r.json();
    setMsg(d.message);
    if (d.success) { setOldPw(""); setNewPw(""); }
    setSaving(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Pengaturan</h2>
      <div className="bg-white rounded-xl shadow-sm p-5 max-w-md">
        <h3 className="font-semibold mb-4">Ubah Password</h3>
        {msg && <div className={`p-3 rounded-xl text-sm mb-3 ${msg.includes("berhasil") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</div>}
        <div className="space-y-3">
          <input type="password" placeholder="Password lama" value={oldPw} onChange={(e) => setOldPw(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
          <input type="password" placeholder="Password baru (min 6 karakter)" value={newPw} onChange={(e) => setNewPw(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"/>
          <button onClick={changePw} disabled={saving || !oldPw || newPw.length < 6}
            className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
            {saving ? "Menyimpan..." : "Ubah Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== MAIN ADMIN PAGE ======
export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (t) setToken(t);
  }, []);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    const r = await fetch("/api/admin/orders", { headers: authHeaders(token) });
    const d = await r.json();
    if (d.success) setOrders(d.orders);
    else { localStorage.removeItem("admin_token"); setToken(null); }
  }, [token]);

  useEffect(() => { if (token) loadOrders(); }, [token, loadOrders]);

  const logout = () => { localStorage.removeItem("admin_token"); setToken(null); };
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  if (!token) return <LoginForm onLogin={setToken}/>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}/>}
      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform`}>
        <Sidebar active={activeTab} setActive={(t) => { setActiveTab(t); setSidebarOpen(false); }} pendingCount={pendingCount} onLogout={logout}/>
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b px-4 sm:px-6 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100"><Menu size={20}/></button>
          <h1 className="font-bold text-lg">BeliIMEI Admin</h1>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          {activeTab === "dashboard" && <DashboardTab orders={orders} token={token}/>}
          {activeTab === "orders" && <OrdersTab orders={orders} token={token} refresh={loadOrders}/>}
          {activeTab === "services" && <ServicesTab token={token}/>}
          {activeTab === "testimonials" && <TestimonialsTab token={token}/>}
          {activeTab === "payments" && <PaymentsTab token={token}/>}
          {activeTab === "landing" && <LandingTab token={token}/>}
          {activeTab === "api-tools" && <ApiToolsTab token={token}/>}
          {activeTab === "settings" && <SettingsTab token={token}/>}
        </main>
      </div>
    </div>
  );
}
