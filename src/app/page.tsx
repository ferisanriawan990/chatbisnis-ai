import Link from 'next/link';
import { Bot, Zap, MessageCircle, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ChatBisnis AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#fitur" className="hover:text-blue-600">Fitur</Link>
            <Link href="#cara-kerja" className="hover:text-blue-600">Cara Kerja</Link>
            <Link href="/pricing" className="hover:text-blue-600">Harga</Link>
            <Link href="/contact" className="hover:text-blue-600">Kontak</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600">Masuk</Link>
            <Link href="/register" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition shadow-md shadow-blue-200">Coba Gratis</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
            <Zap className="w-4 h-4" /> Asisten WhatsApp AI untuk UMKM
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Ubah Pengunjung WhatsApp<br className="hidden md:block"/> Menjadi Pembeli dengan AI
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Tidak perlu lagi begadang membalas chat pelanggan. ChatBisnis AI merespon 24/7, menjawab pertanyaan produk, dan menangkap prospek secara otomatis. Tanpa coding, tanpa ribet setting server.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register" className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-full hover:bg-blue-700 transition shadow-xl shadow-blue-200 w-full sm:w-auto">
              Mulai Sekarang (Gratis)
            </Link>
            <Link href="/contact" className="px-8 py-4 bg-white text-slate-700 border border-slate-200 text-lg font-bold rounded-full hover:bg-slate-50 transition w-full sm:w-auto">
              Hubungi Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-slate-50 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <h2 className="text-3xl font-bold text-slate-900">Masalah UMKM Saat Ini</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4"><span className="text-xl">😴</span></div>
              <h3 className="text-xl font-bold mb-2">Pesan Menumpuk</h3>
              <p className="text-slate-600">Banyak chat masuk di luar jam kerja yang tidak terbalas cepat, membuat pembeli kabur ke kompetitor.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4"><span className="text-xl">💰</span></div>
              <h3 className="text-xl font-bold mb-2">Kehilangan Prospek</h3>
              <p className="text-slate-600">Pelanggan yang tanya-tanya seringkali terlupakan untuk di-follow up sehingga gagal closing.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4"><span className="text-xl">🤯</span></div>
              <h3 className="text-xl font-bold mb-2">Terlalu Teknis</h3>
              <p className="text-slate-600">Sistem API WhatsApp dan AI sangat rumit. Mengurus server dan integrasi memusingkan orang awam.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Solusi Cerdas dari ChatBisnis AI</h2>
            <p className="text-lg text-slate-600">Semua yang Anda butuhkan untuk mengotomatiskan layanan pelanggan.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1"><Bot className="w-8 h-8 text-blue-600" /></div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Kecerdasan Buatan Terlatih</h3>
                  <p className="text-slate-600">AI kami membaca profil bisnis dan produk Anda, memungkinkannya menjawab seakan-akan CS manusia profesional.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1"><TrendingUp className="w-8 h-8 text-emerald-600" /></div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Auto Lead Capture</h3>
                  <p className="text-slate-600">Setiap pelanggan yang bertanya akan otomatis disimpan ke menu Leads, siap untuk difollow-up kemudian.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1"><MessageCircle className="w-8 h-8 text-purple-600" /></div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Human Handover & Out-of-Hours</h3>
                  <p className="text-slate-600">Pelanggan bisa meminta bicara dengan CS manusia. Sistem juga tahu cara menjawab sopan di luar jam kerja.</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-100 rounded-3xl p-8 relative overflow-hidden border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 z-0"></div>
              <div className="relative z-10 space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm self-start max-w-[80%] rounded-tl-sm text-sm">Halo min, toko buka jam berapa ya?</div>
                <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-sm self-end max-w-[80%] rounded-br-sm ml-auto text-sm">
                  Halo! 👋 Toko kami buka setiap hari jam 08:00 - 17:00. Apakah ada yang bisa kami bantu?
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm self-start max-w-[80%] rounded-tl-sm text-sm">Ada jual sepatu lari ukuran 42?</div>
                <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-sm self-end max-w-[80%] rounded-br-sm ml-auto text-sm">
                  Tentu! Kami memiliki sepatu lari "SpeedRunner" ukuran 42 yang sedang ready stock. Harganya Rp 450.000. Ingin kami bantu proses pesanannya? 👟
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="cara-kerja" className="py-24 bg-slate-900 text-white px-4">
        <div className="max-w-5xl mx-auto text-center space-y-16">
          <h2 className="text-3xl font-bold">Aktif Hanya Dalam 3 Langkah</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="text-6xl font-black text-slate-800 absolute -top-8 left-1/2 -translate-x-1/2 z-0">1</div>
              <div className="relative z-10 pt-4">
                <h3 className="text-xl font-bold mb-2">Isi Profil & Data</h3>
                <p className="text-slate-400">Daftar dan isi data toko, jam kerja, serta upload Excel daftar produk Anda.</p>
              </div>
            </div>
            <div className="relative">
              <div className="text-6xl font-black text-slate-800 absolute -top-8 left-1/2 -translate-x-1/2 z-0">2</div>
              <div className="relative z-10 pt-4">
                <h3 className="text-xl font-bold mb-2">Scan QR WA</h3>
                <p className="text-slate-400">Klik "Mulai Sesi" dan scan QR Code menggunakan WhatsApp Business Anda.</p>
              </div>
            </div>
            <div className="relative">
              <div className="text-6xl font-black text-slate-800 absolute -top-8 left-1/2 -translate-x-1/2 z-0">3</div>
              <div className="relative z-10 pt-4">
                <h3 className="text-xl font-bold mb-2">Bot Langsung Aktif</h3>
                <p className="text-slate-400">Bot langsung membalas pelanggan secara cerdas. Anda tinggal memantau dari Dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-lg">ChatBisnis AI</span>
            </div>
            <p className="text-slate-500 text-sm max-w-xs">Solusi cerdas automasi WhatsApp terpercaya untuk UMKM Indonesia.</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Data Enkripsi Aman
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-slate-900">Produk</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="#fitur">Fitur Utama</Link></li>
              <li><Link href="/pricing">Harga Paket</Link></li>
              <li><Link href="/login">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-slate-900">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/privacy">Kebijakan Privasi</Link></li>
              <li><Link href="/terms">Syarat & Ketentuan</Link></li>
              <li><Link href="/contact">Kontak Kami</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-5xl mx-auto border-t border-slate-200 mt-12 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} ChatBisnis AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
