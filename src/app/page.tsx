"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Bot, Zap, MessageCircle, TrendingUp, ShieldCheck, Menu, X, ArrowRight, CheckCircle2, Smartphone, Play } from 'lucide-react';
import { motion, Variants, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

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
            <Link href="/login" className="hidden md:block text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Masuk</Link>
            <Link href="/register" className="hidden md:block px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md shadow-blue-200/50">Coba Gratis</Link>
            <button 
              className="md:hidden text-slate-600 focus:outline-none" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <nav className="flex flex-col px-4 py-6 space-y-4 text-center text-slate-700 font-medium">
                <Link href="#fitur" onClick={() => setIsMobileMenuOpen(false)}>Fitur</Link>
                <Link href="#cara-kerja" onClick={() => setIsMobileMenuOpen(false)}>Cara Kerja</Link>
                <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)}>Harga</Link>
                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>Kontak</Link>
                <hr className="border-slate-100" />
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Masuk</Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="px-5 py-2.5 bg-blue-600 text-white rounded-full inline-block mx-auto">Coba Gratis</Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 px-4 overflow-hidden bg-slate-50">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-40 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <motion.div 
          className="relative z-10 max-w-6xl mx-auto text-center space-y-8"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-semibold mb-2 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            Asisten WhatsApp AI untuk UMKM
          </motion.div>
          <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Ubah Pengunjung WhatsApp <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Menjadi Pembeli dengan AI</span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Tidak perlu lagi begadang membalas chat pelanggan. ChatBisnis AI merespon 24/7, menjawab pertanyaan produk, dan menangkap prospek secara otomatis. Tanpa coding, tanpa ribet setting server.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/register" className="group flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-full hover:bg-blue-700 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.7)] hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto">
              Mulai Sekarang (Gratis)
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/contact" className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 border border-slate-200 text-lg font-bold rounded-full hover:bg-slate-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto">
              <Play className="w-5 h-5 text-blue-600 fill-blue-600" /> Lihat Demo
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-white px-4 relative">
        <div className="absolute inset-0 bg-slate-50/50 opacity-50 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto text-center space-y-16 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-4"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Masalah UMKM Saat Ini
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Kami memahami kendala yang sering Anda hadapi saat mengurus pelanggan via WhatsApp.</p>
          </motion.div>
          <motion.div 
            className="grid md:grid-cols-3 gap-8 text-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {[
              { icon: '😴', bg: 'bg-red-50', title: 'Pesan Menumpuk', desc: 'Banyak chat masuk di luar jam kerja yang tidak terbalas cepat, membuat pembeli kabur ke kompetitor.' },
              { icon: '💰', bg: 'bg-amber-50', title: 'Kehilangan Prospek', desc: 'Pelanggan yang tanya-tanya seringkali terlupakan untuk di-follow up sehingga gagal closing.' },
              { icon: '🤯', bg: 'bg-indigo-50', title: 'Terlalu Teknis', desc: 'Sistem API WhatsApp dan AI sangat rumit. Mengurus server dan integrasi memusingkan orang awam.' }
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="group relative bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-white rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                <div className={`w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}><span className="text-3xl">{item.icon}</span></div>
                <h3 className="text-2xl font-bold mb-4 text-slate-800">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed text-lg">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="py-24 px-4 overflow-hidden bg-slate-50 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">Solusi Cerdas dari ChatBisnis AI</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Semua yang Anda butuhkan untuk mengotomatiskan layanan pelanggan dengan cerdas.</p>
          </motion.div>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              className="space-y-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="flex gap-6 group">
                <div className="flex-shrink-0 mt-1 w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300 shadow-sm">
                  <Bot className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Kecerdasan Buatan Terlatih</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">AI kami membaca profil bisnis dan produk Anda, memungkinkannya menjawab seakan-akan CS manusia profesional dan natural.</p>
                </div>
              </motion.div>
              <motion.div variants={fadeInUp} className="flex gap-6 group">
                <div className="flex-shrink-0 mt-1 w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300 shadow-sm">
                  <TrendingUp className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Auto Lead Capture</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">Setiap pelanggan yang bertanya akan otomatis disimpan ke database Leads, siap untuk difollow-up kemudian untuk meningkatkan konversi.</p>
                </div>
              </motion.div>
              <motion.div variants={fadeInUp} className="flex gap-6 group">
                <div className="flex-shrink-0 mt-1 w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 transition-all duration-300 shadow-sm">
                  <MessageCircle className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Human Handover & Out-of-Hours</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">Pelanggan bisa meminta bicara dengan CS manusia kapan saja. Sistem juga tahu cara menjawab sopan dan informatif di luar jam kerja.</p>
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              className="relative mx-auto w-full max-w-sm"
            >
              {/* Phone Frame Mockup */}
              <div className="relative rounded-[2.5rem] bg-slate-800 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-4 border-slate-800 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 z-20 rounded-t-[2rem] flex justify-center">
                  <div className="w-20 h-4 bg-black rounded-b-xl"></div>
                </div>
                <div className="bg-[#EFEAE2] rounded-[2rem] overflow-hidden relative h-[500px] flex flex-col">
                  {/* Chat Header */}
                  <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3 pt-8 shadow-md relative z-10">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">Toko Sepatu Sport</h4>
                      <p className="text-white/80 text-xs">Online</p>
                    </div>
                  </div>
                  {/* Chat Body */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[url('/whatsapp-bg.png')] bg-cover bg-center">
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.4 }} viewport={{ once: true }} className="bg-white p-3 rounded-2xl shadow-sm self-start max-w-[85%] rounded-tl-none text-[13px] text-slate-800">
                      Halo min, toko buka jam berapa ya?
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.0 }} viewport={{ once: true }} className="bg-[#DCF8C6] p-3 rounded-2xl shadow-sm self-end max-w-[85%] rounded-tr-none ml-auto text-[13px] text-slate-800 relative">
                      Halo! 👋 Toko kami buka setiap hari jam 08:00 - 17:00. Apakah ada yang bisa kami bantu?
                      <span className="absolute bottom-1 right-2 text-[10px] text-slate-500">10:01</span>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.8 }} viewport={{ once: true }} className="bg-white p-3 rounded-2xl shadow-sm self-start max-w-[85%] rounded-tl-none text-[13px] text-slate-800">
                      Ada jual sepatu lari ukuran 42?
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 2.6 }} viewport={{ once: true }} className="bg-[#DCF8C6] p-3 rounded-2xl shadow-sm self-end max-w-[85%] rounded-tr-none ml-auto text-[13px] text-slate-800 relative pb-6">
                      Tentu! Kami memiliki sepatu lari &ldquo;SpeedRunner&rdquo; ukuran 42 yang sedang ready stock. Harganya Rp 450.000. Ingin kami bantu proses pesanannya? 👟
                      <span className="absolute bottom-1 right-2 text-[10px] text-slate-500">10:02</span>
                    </motion.div>
                  </div>
                  {/* Chat Footer */}
                  <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2">
                    <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-slate-400">Ketik pesan...</div>
                    <div className="w-10 h-10 bg-[#00897B] rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white transform translate-x-px" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                    </div>
                  </div>
                </div>
                {/* Decorative glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500 to-purple-500 opacity-20 blur-2xl -z-10 rounded-[3rem]"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="cara-kerja" className="py-24 bg-slate-900 text-white px-4 relative overflow-hidden">
        {/* Abstract background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px]"></div>
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Aktif Hanya Dalam 3 Langkah
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">Tanpa coding, tanpa ribet. Mulai layani pelanggan 24/7 dalam hitungan menit.</p>
          </motion.div>
          <motion.div 
            className="grid md:grid-cols-3 gap-8 relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent z-0"></div>

            <motion.div variants={fadeInUp} className="relative z-10 text-center space-y-6 group">
              <div className="w-24 h-24 mx-auto bg-slate-800 border border-slate-700 rounded-3xl flex items-center justify-center text-3xl font-black text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)] group-hover:scale-110 group-hover:border-blue-500 transition-all duration-300 relative">
                1
                <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Isi Profil & Data</h3>
                <p className="text-slate-400 text-lg leading-relaxed">Daftar dan isi data toko, jam kerja, serta upload Excel daftar produk Anda.</p>
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="relative z-10 text-center space-y-6 group">
              <div className="w-24 h-24 mx-auto bg-slate-800 border border-slate-700 rounded-3xl flex items-center justify-center text-3xl font-black text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)] group-hover:scale-110 group-hover:border-blue-500 transition-all duration-300 relative">
                2
                <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-slate-900">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Scan QR WA</h3>
                <p className="text-slate-400 text-lg leading-relaxed">Klik &ldquo;Mulai Sesi&rdquo; dan scan QR Code menggunakan perangkat WhatsApp Anda.</p>
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="relative z-10 text-center space-y-6 group">
              <div className="w-24 h-24 mx-auto bg-slate-800 border border-slate-700 rounded-3xl flex items-center justify-center text-3xl font-black text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)] group-hover:scale-110 group-hover:border-blue-500 transition-all duration-300 relative">
                3
                <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-slate-900">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Bot Langsung Aktif</h3>
                <p className="text-slate-400 text-lg leading-relaxed">Bot langsung membalas pelanggan secara cerdas. Pantau semuanya dari Dashboard.</p>
              </div>
            </motion.div>
          </motion.div>
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
