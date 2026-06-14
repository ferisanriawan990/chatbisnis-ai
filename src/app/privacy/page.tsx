
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-24 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100 prose prose-blue">
        <h1 className="text-3xl font-bold mb-6">Kebijakan Privasi</h1>
        <p>Berlaku efektif sejak: 14 Juni 2026</p>
        <h2>1. Pengumpulan Data</h2>
        <p>Kami mengumpulkan informasi pendaftaran seperti nama, email, dan detail profil bisnis. Kami juga menyimpan log percakapan chatbot demi keperluan operasional model AI dan retensi riwayat layanan pelanggan Anda.</p>
        <h2>2. Penggunaan Data</h2>
        <p>Data percakapan digunakan semata-mata untuk membalas pesan pelanggan Anda secara akurat menggunakan AI. Kami tidak menjual data pelanggan Anda ke pihak ketiga manapun.</p>
        <h2>3. Keamanan</h2>
        <p>API Key WhatsApp dan AI Anda disimpan dengan enkripsi. Password di-hash dan tidak dapat dilihat oleh sistem kami.</p>
        <h2>4. Pihak Ketiga (Processor)</h2>
        <p>Data percakapan akan dikirimkan ke model AI (seperti OpenAI/Anthropic) dan melalui gateway pihak ketiga untuk mengirimkan pesan WhatsApp. Pemrosesan pembayaran dilakukan oleh Midtrans. Kami mematuhi standar transmisi aman untuk semua pemrosesan lintas batas (cross-border).</p>
        <h2>5. Hak Subjek Data dan Retensi</h2>
        <p>Anda berhak meminta penghapusan penuh atas data bisnis Anda. Log percakapan lama akan dihapus secara otomatis dalam siklus retensi sistem kami untuk mencegah penyalahgunaan data.</p>
      </div>
    </div>
  );
}
