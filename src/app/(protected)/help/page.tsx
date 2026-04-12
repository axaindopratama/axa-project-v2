import { HelpCircle, BookOpen, MessageCircle, Mail, FileText, ExternalLink } from "lucide-react";

export default function HelpPage() {
  const faqs = [
    {
      question: "Bagaimana cara membuat proyek baru?",
      answer: "Klik tombol 'New Project' di sidebar atau gunakan FAB di dashboard. Isi nama proyek, budget, dan detail lainnya."
    },
    {
      question: "Bagaimana cara menambahkan transaksi?",
      answer: "Buka halaman Transaksi, klik 'New Transaction', pilih proyek, masukkan jumlah dan jenis (income/expense)."
    },
    {
      question: "Apa itu Financial Kanban?",
      answer: "Kanban adalah看板 dalam bahasa Jepang berarti 'visual board'. Di AXA Project, Financial Kanban memungkinkan Anda melacak tugas dengan estimasi biaya dan biaya aktual. Pindahkan tugas ke 'Done' untuk memasukkan biaya aktual."
    },
    {
      question: "Bagaimana cara menggunakan AI Scanner?",
      answer: "Buka /scanner, upload foto receipt atau ambil foto langsung. AI akan mengekstrak vendor, tanggal, items, dan total. Verifikasi data sebelum disimpan."
    },
    {
      question: "Apa itu Budget Alert?",
      answer: "Sistem akan memberikan peringatan otomatis saat penggunaan budget mencapai 60% (warning) dan 80% (critical). Lihat di dashboard."
    },
    {
      question: "Bagaimana cara melihat laporan keuangan?",
      answer: "Buka halaman /keuangan untuk melihat cash flow, monthly spending chart, dan budget overview."
    },
  ];

  return (
    <div className="p-10 pt-24 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">
          Pusat Bantuan
        </h1>
        <p className="text-zinc-500 mt-1">
          Panduan dan FAQ untuk AXA Project
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-low p-6 rounded-xl text-center hover:bg-surface-container-high transition-colors cursor-pointer">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-headline font-bold text-on-surface">Dokumentasi</h3>
          <p className="text-xs text-zinc-500 mt-1">Panduan lengkap penggunaan</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl text-center hover:bg-surface-container-high transition-colors cursor-pointer">
          <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-headline font-bold text-on-surface">FAQ</h3>
          <p className="text-xs text-zinc-500 mt-1">Pertanyaan yang sering diajukan</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl text-center hover:bg-surface-container-high transition-colors cursor-pointer">
          <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-headline font-bold text-on-surface">Hubungi Kami</h3>
          <p className="text-xs text-zinc-500 mt-1">Support via email</p>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl p-6">
        <h2 className="text-xl font-headline font-bold text-on-surface mb-6">
          Pertanyaan yang Sering Diajukan
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details key={idx} className="group">
              <summary className="flex items-center justify-between p-4 bg-surface-container-high rounded-lg cursor-pointer list-none">
                <span className="font-headline font-bold text-on-surface">
                  {faq.question}
                </span>
                <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-2 p-4 text-zinc-400 text-sm">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl p-6">
        <h2 className="text-xl font-headline font-bold text-on-surface mb-6">
          Quick Start Guide
        </h2>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-headline font-bold">1</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">Buat Proyek Pertama</h3>
              <p className="text-sm text-zinc-500">Mulai dengan membuat proyek di halaman /projects. Tambahkan budget dan detail proyek.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-headline font-bold">2</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">Tambahkan Tugas</h3>
              <p className="text-sm text-zinc-500">Buat tugas dengan estimasi biaya. Gunakan Financial Kanban untuk melacak progres.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-headline font-bold">3</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">Catat Transaksi</h3>
              <p className="text-sm text-zinc-500">Input setiap pengeluaran dan pendapatan. Gunakan AI Scanner untuk receipt.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-headline font-bold">4</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">Monitor Budget</h3>
              <p className="text-sm text-zinc-500">Pantau penggunaan budget di dashboard. Perhatikan alert saat mencapai 60% dan 80%.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <HelpCircle className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-headline font-bold text-on-surface">
            Butuh bantuan lebih lanjut?
          </h2>
        </div>
        <p className="text-zinc-400 mb-4">
          Hubungi tim support kami untuk assistance lebih lanjut.
        </p>
        <button className="gold-gradient px-6 py-2 rounded-lg font-headline font-bold text-sm text-on-primary hover:shadow-lg transition-all">
          Hubungi Support
        </button>
      </div>
    </div>
  );
}