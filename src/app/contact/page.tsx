
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-32 px-4 relative overflow-hidden animate-in fade-in duration-700">
      {/* Premium Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent blur-[100px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-3xl mx-auto bg-white/60 backdrop-blur-xl p-8 md:p-16 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none -z-10"></div>
        
        <div className="inline-flex items-center justify-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 text-sm font-bold text-indigo-700 uppercase tracking-wider mx-auto mb-8">
          Hubungi Kami
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-slate-900">Kami Siap Membantu</h1>
        <p className="text-lg text-slate-600 mb-12 font-medium max-w-xl mx-auto">Memiliki pertanyaan seputar fitur Enterprise atau bantuan teknis? Tim kami siap merespons Anda dengan cepat.</p>
        
        <div className="grid md:grid-cols-2 gap-6 text-left">
          <div className="p-8 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm rounded-3xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Email Support</h3>
            <p className="text-lg font-bold text-slate-800">support@chatbisnis.ai</p>
          </div>
          
          <div className="p-8 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm rounded-3xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp CS</h3>
            <p className="text-lg font-bold text-slate-800">+62 821-0000-0000</p>
          </div>

          <div className="md:col-span-2 p-8 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div>
                <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2">Jam Operasional</h3>
                <p className="text-xl font-bold">Senin - Jumat</p>
                <p className="text-indigo-200 mt-1">09:00 - 17:00 WIB</p>
              </div>
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
