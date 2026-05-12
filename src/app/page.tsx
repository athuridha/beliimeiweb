"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Shield, Zap, Award, ChevronDown, ChevronRight, Star, Search,
  Smartphone, Clock, CheckCircle, MessageCircle, Menu, X,
} from "lucide-react";

interface Service { code: string; name: string; sell_price: number }
interface Testimonial { id: string; name: string; rating: number; comment: string }

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur shadow-sm" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <img src="/logo.png" alt="BeliIMEI Logo" className="w-8 h-8 object-contain" />
          BeliIMEI
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#layanan" className="text-sm font-medium text-gray-600 hover:text-primary transition">Layanan</a>
          <a href="#cara-kerja" className="text-sm font-medium text-gray-600 hover:text-primary transition">Cara Kerja</a>
          <a href="#testimoni" className="text-sm font-medium text-gray-600 hover:text-primary transition">Testimoni</a>
          <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-primary transition">FAQ</a>
          <Link href="/track" className="text-sm font-medium text-gray-600 hover:text-primary transition">Lacak Pesanan</Link>
          <Link href="/order" className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition shadow-md shadow-primary/25">Pesan Sekarang</Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-gray-600">{open ? <X size={24}/> : <Menu size={24}/>}</button>
      </div>
      {open && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-3 space-y-3">
            <a href="#layanan" onClick={() => setOpen(false)} className="block text-sm text-gray-700 hover:text-primary">Layanan</a>
            <a href="#cara-kerja" onClick={() => setOpen(false)} className="block text-sm text-gray-700 hover:text-primary">Cara Kerja</a>
            <a href="#testimoni" onClick={() => setOpen(false)} className="block text-sm text-gray-700 hover:text-primary">Testimoni</a>
            <a href="#faq" onClick={() => setOpen(false)} className="block text-sm text-gray-700 hover:text-primary">FAQ</a>
            <Link href="/track" className="block text-sm text-gray-700 hover:text-primary">Lacak Pesanan</Link>
            <Link href="/order" className="block bg-primary text-white text-center py-2 rounded-lg text-sm font-semibold">Pesan Sekarang</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  const parallaxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = () => {
      if (parallaxRef.current) {
        const y = window.scrollY;
        parallaxRef.current.style.transform = `translateY(${y * 0.3}px)`;
        parallaxRef.current.style.opacity = String(Math.max(0, 1 - y / 600));
      }
    };
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-violet-50 via-white to-cyan-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"/>
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl"/>
      </div>
      <div ref={parallaxRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
              Aktivasi IMEI<br/>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Tanpa Ribet.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg">
              Layanan roamer IMEI resmi, cepat, dan aman. Perangkat Anda bisa digunakan di semua operator Indonesia.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/order" className="bg-primary text-white px-8 py-3.5 rounded-xl font-semibold text-center hover:bg-primary-dark transition shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5">
                Mulai Aktivasi
              </Link>
              <a href="#layanan" className="border-2 border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold text-center hover:border-primary hover:text-primary transition">
                Lihat Paket
              </a>
            </div>
            <div className="mt-10 flex items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500"/> 99% Sukses Rate</div>
              <div className="flex items-center gap-2"><Clock size={18} className="text-primary"/> 24/7 Support</div>
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { icon: <Zap size={28}/>, title: "Proses Instan", desc: "Aktivasi dalam hitungan menit", color: "from-amber-400 to-orange-500" },
              { icon: <Shield size={28}/>, title: "100% Aman", desc: "Resmi dan terdaftar di CEIR", color: "from-primary to-indigo-600" },
              { icon: <Award size={28}/>, title: "Garansi", desc: "Jaminan uang kembali jika gagal", color: "from-emerald-400 to-teal-500" },
              { icon: <MessageCircle size={28}/>, title: "Support 24/7", desc: "WhatsApp admin selalu ready", color: "from-cyan-400 to-blue-500" },
            ].map((c, i) => (
              <div key={i} className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 ${i === 1 ? "translate-y-6" : ""} ${i === 2 ? "-translate-y-2" : ""}`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center mb-4`}>{c.icon}</div>
                <h3 className="font-bold text-gray-900">{c.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ services }: { services: Record<string, Service> }) {
  const list = Object.values(services);
  return (
    <section id="layanan" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">PAKET LAYANAN</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">Pilih Paket Sesuai Kebutuhan</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {list.map((svc) => (
            <div key={svc.code} className="group relative bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-t-2xl opacity-0 group-hover:opacity-100 transition"/>
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                <Smartphone size={28} className="text-primary"/>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{svc.name}</h3>
              <p className="text-gray-500 text-sm mb-6">{svc.code === "roamer_instant" ? "Proses langsung via API, hasil instan" : "Proses manual oleh admin, 1-3 hari"}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-primary">Rp {svc.sell_price.toLocaleString("id-ID")}</span>
              </div>
              <Link href="/order" className="block w-full bg-primary text-white text-center py-3 rounded-xl font-semibold hover:bg-primary-dark transition">Pesan Sekarang</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { num: "01", title: "Isi Form Pesanan", desc: "Masukkan IMEI, nama, dan nomor WhatsApp Anda" },
    { num: "02", title: "Pilih Pembayaran", desc: "Pilih metode (QRIS/Transfer) dan upload bukti bayar" },
    { num: "03", title: "Admin Proses", desc: "Admin verifikasi pembayaran dan proses IMEI Anda" },
    { num: "04", title: "IMEI Aktif", desc: "IMEI berhasil diaktifkan, perangkat siap digunakan" },
  ];
  return (
    <section id="cara-kerja" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">CARA KERJA</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">4 Langkah Mudah</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl flex items-center justify-center font-extrabold text-lg mb-4 group-hover:scale-110 transition">{s.num}</div>
              <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: <Shield size={24}/>, title: "Resmi & Legal", desc: "Terdaftar di sistem CEIR Kemenperin" },
    { icon: <Zap size={24}/>, title: "Proses Cepat", desc: "Layanan Fast selesai dalam hitungan menit" },
    { icon: <Award size={24}/>, title: "Garansi Uang Kembali", desc: "100% refund jika gagal aktivasi" },
    { icon: <MessageCircle size={24}/>, title: "Support WhatsApp", desc: "Admin siap membantu 24/7" },
    { icon: <CheckCircle size={24}/>, title: "Tracking Real-time", desc: "Pantau status pesanan kapan saja" },
    { icon: <Clock size={24}/>, title: "Aktif 3 Bulan", desc: "Roamer berlaku selama 3 bulan" },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">KEUNGGULAN</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">Mengapa Memilih Kami?</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="flex gap-4 p-5 rounded-xl hover:bg-gray-50 transition">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 text-primary">{f.icon}</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (!testimonials.length) return null;
  return (
    <section id="testimoni" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">TESTIMONI</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">Kata Mereka</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(0, 6).map((t) => (
            <div key={t.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={16} className={s <= t.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}/>
                ))}
              </div>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">&ldquo;{t.comment}&rdquo;</p>
              <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrackCTASection() {
  return (
    <section className="py-16 bg-gradient-to-r from-primary to-primary-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <Search size={40} className="text-white/80 mx-auto mb-4"/>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Lacak Pesanan Anda</h2>
        <p className="text-white/80 mb-8 max-w-lg mx-auto">Masukkan Order ID untuk melihat status pesanan Anda secara real-time</p>
        <Link href="/track" className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition shadow-lg">
          Lacak Sekarang <ChevronRight size={18}/>
        </Link>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: "Apa itu layanan Roamer IMEI?", a: "Roamer IMEI adalah layanan untuk mendaftarkan IMEI perangkat Anda di sistem CEIR Kemenperin agar perangkat bisa digunakan dengan kartu SIM operator Indonesia." },
    { q: "Berapa lama proses aktivasi?", a: "Untuk layanan Fast (Instan), proses selesai dalam hitungan menit. Untuk layanan Selow, proses memakan waktu 1-3 hari kerja." },
    { q: "Apakah aman dan legal?", a: "Ya, layanan kami 100% resmi dan terdaftar di sistem CEIR. IMEI akan terdaftar secara legal di database Kemenperin." },
    { q: "Bagaimana cara pembayaran?", a: "Kami menerima pembayaran via QRIS (GoPay, OVO, DANA, dll) dan Transfer Bank. Setelah bayar, upload bukti pembayaran di halaman order." },
    { q: "Apakah ada garansi?", a: "Ya, kami memberikan garansi uang kembali 100% jika proses aktivasi gagal." },
    { q: "Berapa lama Roamer aktif?", a: "Roamer IMEI berlaku selama 3 bulan sejak tanggal aktivasi." },
  ];
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">FAQ</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">Pertanyaan Umum</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
              <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition">
                <span className="font-semibold text-gray-900">{f.q}</span>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${openIdx === i ? "rotate-180" : ""}`}/>
              </button>
              {openIdx === i && <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">BeliIMEI</h3>
            <p className="text-sm">Layanan aktivasi IMEI terpercaya, cepat, dan aman.</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Link</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#layanan" className="hover:text-white transition">Layanan</a></li>
              <li><a href="#cara-kerja" className="hover:text-white transition">Cara Kerja</a></li>
              <li><Link href="/track" className="hover:text-white transition">Lacak Pesanan</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Kontak</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="https://wa.me/6281384143551" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 hover:text-green-400 transition"
                >
                  <MessageCircle size={18} />
                  <span>Chat WhatsApp</span>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={18} />
                <span>Jam Kerja: 24/7</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          &copy; {new Date().getFullYear()} BeliIMEI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const [services, setServices] = useState<Record<string, Service>>({});
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((d) => { if (d.success) setServices(d.services); });
    fetch("/api/testimonials").then((r) => r.json()).then((d) => { if (d.success) setTestimonials(d.testimonials); });
  }, []);

  return (
    <>
      <Navbar/>
      <HeroSection/>
      <ServicesSection services={services}/>
      <HowItWorksSection/>
      <FeaturesSection/>
      <TestimonialsSection testimonials={testimonials}/>
      <TrackCTASection/>
      <FAQSection/>
      <Footer/>
    </>
  );
}
