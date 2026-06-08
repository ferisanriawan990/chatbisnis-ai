
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-24 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100 text-center">
        <h1 className="text-3xl font-bold mb-6">Hubungi Kami</h1>
        <p className="text-slate-600 mb-8">Memiliki pertanyaan seputar fitur Enterprise atau bantuan teknis? Tim kami siap membantu Anda.</p>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 text-blue-700 rounded-xl">
            <strong>Email:</strong> support@chatbisnis.ai
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl">
            <strong>WhatsApp CS:</strong> +62 812-3456-7890
          </div>
          <div className="p-4 bg-slate-50 text-slate-700 rounded-xl">
            <strong>Jam Operasional:</strong> Senin - Jumat (09:00 - 17:00 WIB)
          </div>
        </div>
      </div>
    </div>
  );
}
