import { PlusCircle, Search, MessageSquare, MapPin, Sparkles } from "lucide-react";

export default function CitizenDashboardPage() {
  const stats = [
    { label: "Total Aduan", count: 4, value: "4 aduan", color: "border-blue-500" },
    { label: "Dalam Semakan", count: 1, value: "1 aduan", color: "border-amber-500" },
    { label: "Sedang Bertindak", count: 2, value: "2 aduan", color: "border-indigo-500" },
    { label: "Telah Selesai", count: 1, value: "1 aduan", color: "border-emerald-500" },
  ];

  const aduanList = [
    {
      id: 1,
      title: "Lampu jalan rosak berhampiran taman permainan",
      location: "Taman X, Shah Alam",
      date: "16 Sept 2026",
      status: "Dalam Semakan",
      statusColor: "bg-amber-50 text-amber-600 border-amber-200",
      icon: "💡",
    },
    {
      id: 2,
      title: "Kutipan sampah tidak dibuat",
      location: "Petaling Jaya",
      date: "11 Sept 2026",
      status: "Selesai",
      statusColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
      icon: "🗑️",
    },
    {
      id: 3,
      title: "Jalan rosak",
      location: "Shah Alam",
      date: "19 Sept 2026",
      status: "Baharu",
      statusColor: "bg-blue-50 text-blue-600 border-blue-200",
      icon: "🛣️",
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hai, Ain</h1>
          <p className="text-xs text-slate-500">Apa yang perlukan perhatian hari ini?</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm">
          <MapPin className="w-4 h-4 text-blue-500" />
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Kawasan Parlimen</span>
            <span className="font-bold text-slate-800">P.108 Shah Alam / N.40 Kota Anggerik</span>
          </div>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <button className="bg-[#0c66a4] text-white p-5 rounded-2xl text-left hover:opacity-95 transition flex flex-col justify-between h-36">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Hantar Aduan</h3>
            <p className="text-xs text-blue-100">Laporkan isu dalam 3 langkah.</p>
          </div>
        </button>

        <button className="bg-[#0d9488] text-white p-5 rounded-2xl text-left hover:opacity-95 transition flex flex-col justify-between h-36">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Semak Status</h3>
            <p className="text-xs text-teal-100">Jejaki tindakan untuk aduan anda.</p>
          </div>
        </button>

        <button className="bg-[#3b82f6] text-white p-5 rounded-2xl text-left hover:opacity-95 transition flex flex-col justify-between h-36">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Chat dengan WaKiL AI</h3>
            <p className="text-xs text-blue-100">Dapatkan panduan serta-merta.</p>
          </div>
        </button>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((item, idx) => (
          <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 rounded-full border-2 ${item.color} flex items-center justify-center font-bold text-xs text-slate-800`}>
              {item.count}
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">{item.label}</p>
              <p className="text-xs font-bold text-slate-800">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Aduan Terkini (Left 2 cols) */}
        <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Aduan Terkini</h3>
            <button className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg font-semibold hover:bg-blue-100">
              Lihat semua
            </button>
          </div>

          <div className="space-y-3">
            {aduanList.map((aduan) => (
              <div key={aduan.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-3">
                    <span className="text-lg p-2 bg-white rounded-lg border border-slate-100 shadow-sm">{aduan.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{aduan.title}</h4>
                      <p className="text-[11px] text-slate-400">{aduan.location} • {aduan.date}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${aduan.statusColor}`}>
                    {aduan.status}
                  </span>
                </div>
                {/* Progress bar placeholder */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#0d9488] h-full w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI & Hotspot Analytics (Right 1 col) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              <Sparkles className="w-3 h-3" /> Analisis AI & Hotspot
            </span>
            <h4 className="font-bold text-sm text-slate-800">Taman X</h4>

            {/* Map Placeholder */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl h-36 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px]" />
              <div className="text-[10px] text-slate-400 font-bold z-10 bg-white/80 px-2 py-1 rounded border border-slate-200">
                Taman X
              </div>
              <MapPin className="w-5 h-5 text-rose-500 absolute top-6 left-12" />
              <MapPin className="w-5 h-5 text-rose-500 absolute top-8 right-16" />
              <MapPin className="w-5 h-5 text-rose-500 absolute bottom-6 right-10" />
            </div>

            <p className="text-xs text-slate-600 font-medium">
              <span className="font-bold text-slate-900">WaKiL AI:</span> 5 isu lampu jalan terkesan di Taman X
            </p>
          </div>

          <button className="w-full bg-[#0d9488] hover:bg-[#0b7c72] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
            <Sparkles className="w-3.5 h-3.5" /> Auto-Fill Aduan
          </button>
        </div>
      </div>
    </div>
  );
}