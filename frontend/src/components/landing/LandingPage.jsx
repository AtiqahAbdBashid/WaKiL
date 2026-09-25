import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Building2,
  ShieldCheck,
  MessageCircle,
  X,
  RotateCcw,
  Send,
  Paperclip,
  Mic,
  Eye,
  EyeOff,
  Check,
  LockKeyhole,
  Mail,
  ArrowRight,
} from "lucide-react";

import wakilPano from "/src/assets/wakilPano.png";

/* =========================================================
   1. TRANSLATIONS / DICTIONARY DATA
   ========================================================= */

const translations = {
  bm: {
    // Header
    portalTitle: "Menghubungkan Rakyat dengan Wakil Rakyat",
    portalSubtitle: "Suara Rakyat, Mandat Wakil",
    myDigitalID: "MyDigital ID",
    ybLogin: "Log Masuk YB",

    // Hero Section
    badge: "CONNECT • REPORT • TRACK • TOGETHER",
    heroTitle: "Malaysia Lebih Kukuh, Bersama.",
    heroSubtitle: "Melalui Perbualan Lebih Pintar.",
    heroDescription:
      "Sebuah Malaysia yang lebih teguh dimulakan dengan komunikasi dua hala yang telus. Hubungkan aduan warganegara terus ke dewan parlimen melalui kecerdasan buatan dan analitik berasaskan data.",
    heroQuote: "“Conversations for Progress, Nation-Building.”",

    // Citizen Portal Card
    citizenPortal: "Portal Warganegara",
    citizenDescription:
      "Hantar aduan komuniti, semak status dan berkomunikasi dengan wakil rakyat anda secara terus dan dipercayai.",
    citizenButton: "Masuk sebagai Warganegara",

    // YB Portal Card
    ybPortal: "Portal YB",
    ybDescription:
      "Dashboard AI untuk wakil rakyat memantau, menganalisis dan menguruskan isu komuniti di seluruh kawasan parlimen.",
    ybButton: "Masuk sebagai YB / Wakil Rakyat",

    // Footer
    footer:
      "© 2026 WaKiL — Platform Civic Technology Malaysia • Lembah Pantai (P121) & Raub (P130)",
    privacy: "Dasar Privasi",
    terms: "Syarat Penggunaan",
    dataIntegrity: "Integriti Data Komuniti",

    // Floating AI & Chat Controls
    chatButton: "Chat dengan WaKiL AI",
    chatSubtitle: "Pembantu Sivik Pintar / Dalam talian",
    chatRestart: "Mulakan Semula Sembang",
    chatClose: "Tutup",

    // Chat Initial State & Options
    chatWelcome: (
      <>
        Selamat datang ke <strong>WaKiL AI</strong>. 👋
        <br />
        Bagaimana saya boleh bantu anda hari ini?
      </>
    ),
    chatGreetingOptions: [
      "Hantar Aduan Baru",
      "Semak Status Aduan",
      "Tanya Soalan",
      "Panduan Penggunaan",
    ],

    // Chat Automated Responses
    complaintQuestion:
      "Baik, saya akan bantu anda merekodkan aduan. Apakah masalah yang ingin dilaporkan?",
    loginResponse:
      "Untuk maklumat ini, anda boleh log masuk melalui MyDigital ID untuk maklumat penuh yang dipautkan ke kad pengenalan anda, atau taip pertanyaan terus di ruangan sembang di bawah.",
    loginButton: "Log Masuk MyDigital ID",
    issueOptions: [
      "🚧 Jalan berlubang / rosak",
      "💡 Lampu jalan padam",
      "🌊 Longkang tersumbat",
      "🗑️ Sampah tidak dikutip",
      "⚙️ Masalah lain",
    ],

    // Complaint Form Details
    complaintDetails: "Butiran Aduan",
    incidentLocation: "Lokasi Kejadian",
    locationPlaceholder: "Cth: Jalan Bangsar Utama 3, Kuala Lumpur",
    shortDescription: "Penerangan Ringkas",
    descriptionPlaceholder: "Nyatakan situasi...",
    submitComplaint: "Hantar Aduan",
    defaultLocation: "Jalan Pantai Baru, Bangsar",
    defaultDescription:
      "Terdapat lubang jalan yang agak dalam dan berbahaya kepada penunggang motosikal berhampiran simpang.",

    // Complaint Submission Success Status
    complaintSuccess: "Aduan berjaya dihantar!",
    complaintID: "ID Aduan:",
    category: "Kategori:",
    location: "Lokasi:",
    successDescription:
      "Laporan anda telah direkodkan. Pasukan khidmat masyarakat dan pentadbir kawasan akan menyemak aduan ini dan menghubungi anda dalam tempoh 24 jam.",
    status: "Status: Diserahkan ke Parlimen",
    linkMyDigitalID: "Pautkan ke MyDigital ID →",

    // Chat Input Fields
    chatPlaceholder: "Tanya soalan atau nyatakan aduan...",
    attach: "Lampirkan foto / dokumen",
    voice: "Rakam suara",
    send: "Hantar",

    // Citizen Modal Content
    citizenLoginTitle: "Log Masuk Warganegara",
    citizenLoginSubtitle: "Pengesahan Identiti Digital Kebangsaan",
    citizenLoginDescription: (
      <>
        Bagi menjamin keselamatan aduan anda dan mencegah penyalahgunaan, akses
        portal warganegara disahkan secara rasmi melalui ekosistem{" "}
        <span className="text-[#24c7ba] font-bold">MyDigital ID</span>.
      </>
    ),
    continueMyDigitalID: "Teruskan dengan MyDigital ID",
    checkStatusOnly: "Semak Status Aduan Sahaja (Tanpa Log Masuk)",
    personalData:
      "Data peribadi disulitkan mengikut Akta Perlindungan Data Peribadi 2010.",

    // YB Modal Content
    ybLoginTitle: "Log Masuk Portal YB & Pegawai Khidmat",
    ybLoginSubtitle:
      "Papan Pemuka Ahli Parlimen / ADUN & Agensi Pelaksana",
    restrictedAccess:
      "Akses Terhad & Selamat — Khusus Wakil Rakyat & Kakitangan Berdaftar",
    officialEmail: "Emel Rasmi Pejabat / Kerajaan",
    emailPlaceholder: "cth: yb.khairul@parlimen.gov.my",
    password: "Kata Laluan",
    passwordPlaceholder: "••••••••••••",
    rememberMe: "Ingat saya pada peranti ini",
    forgotPassword: "Lupa kata laluan?",
    loginDashboard: "Log Masuk ke Papan Pemuka",
    governmentMyDigitalID:
      "Atau log masuk dengan MyDigital ID Pegawai Kerajaan",
    securityNotice:
      "Dilindungi oleh Akta Perlindungan Data Peribadi 2010 (PDPA) & Piawaian Keselamatan Siber Kebangsaan (NACSA).",
  },

  en: {
    // Header
    portalTitle: "Connecting Citizens with Their Representatives",
    portalSubtitle: "People's Voice, Representative's Mandate",
    myDigitalID: "MyDigital ID",
    ybLogin: "YB Login",

    // Hero Section
    badge: "CONNECT • REPORT • TRACK • TOGETHER",
    heroTitle: "A Stronger Malaysia, Together.",
    heroSubtitle: "Through Smarter Conversation.",
    heroDescription:
      "A stronger Malaysia begins with transparent two-way communication. Connect citizen complaints directly to Parliament through artificial intelligence and data-driven analytics.",
    heroQuote: "“Conversations for Progress, Nation-Building.”",

    // Citizen Portal Card
    citizenPortal: "Citizen Portal",
    citizenDescription:
      "Submit community complaints, check status and communicate directly with your elected representative in a trusted and transparent way.",
    citizenButton: "Enter as Citizen",

    // YB Portal Card
    ybPortal: "YB Portal",
    ybDescription:
      "AI dashboard for representatives to monitor, analyse and manage community issues across their parliamentary constituency.",
    ybButton: "Enter as YB / Representative",

    // Footer
    footer:
      "© 2026 WaKiL — Malaysian Civic Technology Platform • Lembah Pantai (P121) & Raub (P130)",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    dataIntegrity: "Community Data Integrity",

    // Floating AI & Chat Controls
    chatButton: "Chat with WaKiL AI",
    chatSubtitle: "Smart Civic Assistant / Online",
    chatRestart: "Restart Chat",
    chatClose: "Close",

    // Chat Initial State & Options
    chatWelcome: (
      <>
        Welcome to <strong>WaKiL AI</strong>. 👋
        <br />
        How can I help you today?
      </>
    ),
    chatGreetingOptions: [
      "Submit New Complaint",
      "Check Complaint Status",
      "Ask a Question",
      "Usage Guide",
    ],

    // Chat Automated Responses
    complaintQuestion:
      "Sure, I can help you record a complaint. What issue would you like to report?",
    loginResponse:
      "For this information, you can log in through MyDigital ID to access information linked to your identity, or type your question directly in the chat below.",
    loginButton: "Log In with MyDigital ID",
    issueOptions: [
      "🚧 Pothole / damaged road",
      "💡 Street light not working",
      "🌊 Blocked drain",
      "🗑️ Uncollected rubbish",
      "⚙️ Other issue",
    ],

    // Complaint Form Details
    complaintDetails: "Complaint Details",
    incidentLocation: "Incident Location",
    locationPlaceholder: "E.g. Jalan Bangsar Utama 3, Kuala Lumpur",
    shortDescription: "Brief Description",
    descriptionPlaceholder: "Describe the situation...",
    submitComplaint: "Submit Complaint",
    defaultLocation: "Jalan Pantai Baru, Bangsar",
    defaultDescription:
      "There is a deep pothole near the junction that may be dangerous for motorcycle riders.",

    // Complaint Submission Success Status
    complaintSuccess: "Complaint submitted successfully!",
    complaintID: "Complaint ID:",
    category: "Category:",
    location: "Location:",
    successDescription:
      "Your report has been recorded. The community service team and area administrator will review the complaint and contact you within 24 hours.",
    status: "Status: Submitted to Parliament",
    linkMyDigitalID: "Link to MyDigital ID →",

    // Chat Input Fields
    chatPlaceholder: "Ask a question or describe an issue...",
    attach: "Attach photo / document",
    voice: "Record voice",
    send: "Send",

    // Citizen Modal Content
    citizenLoginTitle: "Citizen Login",
    citizenLoginSubtitle: "National Digital Identity Verification",
    citizenLoginDescription: (
      <>
        To protect your complaints and prevent misuse, citizen portal access is
        officially verified through the{" "}
        <span className="text-[#24c7ba] font-bold">MyDigital ID</span> ecosystem.
      </>
    ),
    continueMyDigitalID: "Continue with MyDigital ID",
    checkStatusOnly: "Check Complaint Status Only (Without Login)",
    personalData:
      "Personal data is encrypted in accordance with the Personal Data Protection Act 2010.",

    // YB Modal Content
    ybLoginTitle: "YB & Service Officer Portal Login",
    ybLoginSubtitle:
      "Dashboard for Members of Parliament / State Assembly & Implementing Agencies",
    restrictedAccess:
      "Restricted & Secure Access — For Elected Representatives & Registered Staff Only",
    officialEmail: "Official Office / Government Email",
    emailPlaceholder: "e.g. yb.khairul@parlimen.gov.my",
    password: "Password",
    passwordPlaceholder: "••••••••••••",
    rememberMe: "Remember me on this device",
    forgotPassword: "Forgot password?",
    loginDashboard: "Log In to Dashboard",
    governmentMyDigitalID:
      "Or log in with Government Officer MyDigital ID",
    securityNotice:
      "Protected by the Personal Data Protection Act 2010 (PDPA) & National Cyber Security Standards (NACSA).",
  },
};

/* =========================================================
   2. MAIN COMPONENT
   ========================================================= */

export default function MainPage({ onLoginCitizen, onLoginYB }) {
  const navigate = useNavigate();

  // State 1: Language selection
  const [language, setLanguage] = useState("bm");

  // State 2: Modal Visibility Controls
  const [showCitizenModal, setShowCitizenModal] = useState(false);
  const [showYBModal, setShowYBModal] = useState(false);

  // State 3: Chat Drawer Controls & Visibility
  const [showChat, setShowChat] = useState(false);
  const [chatFlow, setChatFlow] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // State 4: Form Helpers
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Reference for auto-scrolling the chat panel
  const chatContainerRef = useRef(null);

  // Helper variables for quick access
  const t = translations[language];
  const isBM = language === "bm";

  /* ---------------------------------------------------------
     3. HELPER & HANDLER FUNCTIONS
     --------------------------------------------------------- */

  // Auto-scroll chat to bottom whenever messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatFlow]);

  // Toggle chat visibility
  const toggleChatModal = () => {
    setShowChat((prev) => !prev);
  };

  // Clear chat logs
  const resetChatFlow = () => {
    setChatFlow([]);
    setChatInput("");
  };

  // Handles clicking initial greeting buttons inside the chat
  const handleSelectGreeting = (index) => {
    const selectedText = t.chatGreetingOptions[index];

    // Append user's action to chat
    setChatFlow((prev) => [...prev, { type: "user", content: selectedText }]);

    // Simulate AI response delay
    setTimeout(() => {
      if (index === 0) {
        setChatFlow((prev) => [
          ...prev,
          {
            type: "ai",
            content: t.complaintQuestion,
            options: t.issueOptions,
            action: "issue",
          },
        ]);
      } else {
        setChatFlow((prev) => [
          ...prev,
          {
            type: "ai",
            content: t.loginResponse,
            action: "login",
          },
        ]);
      }
    }, 300);
  };

  // Handles issue/category selection step inside chat
  const handleSelectIssue = (category) => {
    setChatFlow((prev) => [...prev, { type: "user", content: category }]);

    setTimeout(() => {
      setChatFlow((prev) => [
        ...prev,
        {
          type: "form",
          category,
        },
      ]);
    }, 300);
  };

  // Handles submittal of inline complaint form inside chat
  const handleSubmitComplaint = (e, category) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const location = formData.get("location") || t.defaultLocation;

    setChatFlow((prev) => [
      ...prev,
      {
        type: "user",
        content: `${t.submitComplaint}: ${location}`,
      },
    ]);

    setTimeout(() => {
      setChatFlow((prev) => [
        ...prev,
        {
          type: "success",
          category,
          location,
        },
      ]);
    }, 400);
  };

  // Handles standard text entry inside chat
  const handleUserSubmitInput = (e) => {
    e.preventDefault();

    const msg = chatInput.trim();
    if (!msg) return;

    setChatFlow((prev) => [...prev, { type: "user", content: msg }]);
    setChatInput("");

    setTimeout(() => {
      setChatFlow((prev) => [
        ...prev,
        {
          type: "ai",
          content: (
            <>
              {isBM ? (
                <>
                  Terima kasih atas mesej anda mengenai <em>"{msg}"</em>. Saya
                  sedia membantu merekodkan laporan ini atau menyemak sebarang
                  info parlimen kawasan anda. Pilih salah satu butang pantas di
                  atas atau berikan alamat terperinci.
                </>
              ) : (
                <>
                  Thank you for your message regarding <em>"{msg}"</em>. I can
                  help record this report or provide information about your
                  parliamentary area. Choose one of the quick options above or
                  provide a detailed location.
                </>
              )}
            </>
          ),
        },
      ]);
    }, 400);
  };

  /* ---------------------------------------------------------
     4. RENDER LAYOUT
     --------------------------------------------------------- */

  return (
    <div className="h-screen bg-[#051120] text-slate-100 flex flex-col font-sans antialiased overflow-hidden select-none relative">
      {/* =====================================================
          HEADER SECTION
         ===================================================== */}
      <header className="h-[68px] shrink-0 bg-white border-b border-slate-200/80 px-6 lg:px-10 flex items-center justify-between z-30 shadow-sm">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center"
          >
            <img
              src="/src/assets/wakilLogo.png"
              alt="WaKiL Logo"
              className="h-12 w-auto object-contain"
            />
          </button>

          <div className="hidden sm:block border-l border-slate-200 pl-3">
            <p className="text-[14px] font-extrabold uppercase tracking-wider text-slate-700 leading-tight">
              {t.portalTitle}
            </p>
            <p className="text-[14px] text-slate-500 font-medium">
              {t.portalSubtitle}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 lg:space-x-9 text-xs font-semibold text-slate-700">
          <button className="hover:text-[#129c92] transition-colors">
            {t.navPortal}
          </button>
          <button className="hover:text-[#129c92] transition-colors">
            {t.navSmart}
          </button>
          <button className="hover:text-[#129c92] transition-colors">
            {t.navStats}
          </button>
          <button className="hover:text-[#129c92] transition-colors">
            {t.navAbout}
          </button>
        </nav>

        {/* Action Controls (Language Selector & Logins) */}
        <div className="flex items-center space-x-3.5">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70 text-xs font-bold">
            <button
              onClick={() => setLanguage("bm")}
              className={`px-2.5 py-1 rounded-lg transition ${
                language === "bm"
                  ? "bg-[#19a7a8] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              BM
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-2.5 py-1 rounded-lg transition ${
                language === "en"
                  ? "bg-[#19a7a8] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              EN
            </button>
          </div>

          {/* Citizen Login Trigger */}
          <button
            onClick={() => setShowCitizenModal(true)}
            className="hidden sm:inline-flex items-center space-x-2 border border-[#17a59a] bg-teal-50/40 hover:bg-teal-50 text-[#128a80] text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>{t.myDigitalID}</span>
          </button>

          {/* YB Login Trigger */}
          <button
            onClick={() => setShowYBModal(true)}
            className="inline-flex items-center space-x-2 bg-[#129c92] hover:bg-[#0f877e] text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.ybLogin}</span>
          </button>
        </div>
      </header>

      {/* =====================================================
          HERO MAIN CONTENT
         ===================================================== */}
      <main
        className="relative flex-1 flex flex-col bg-[#061426] px-6 lg:px-12 py-5 overflow-hidden justify-center items-center"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(5, 17, 32, 0.76) 0%,
              rgba(4, 13, 24, 0.88) 60%,
              rgba(3, 9, 18, 0.95) 100%
            ),
            url(${wakilPano})
          `,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Hero Headings */}
        <div className="w-full max-w-4xl mx-auto text-center flex flex-col items-center pt-2">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-[#122b48]/70 border border-slate-500/40 text-[10px] md:text-[11px] font-bold tracking-[0.16em] text-slate-300 uppercase shadow-inner mb-4">
            {t.badge}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-[44px] font-extrabold text-white tracking-tight leading-tight">
            {t.heroTitle}
          </h1>

          <h2 className="text-2xl md:text-3xl lg:text-[38px] font-extrabold text-[#22b7ab] tracking-tight mt-0.5 leading-tight">
            {t.heroSubtitle}
          </h2>

          <p className="mt-3.5 text-slate-300 text-xs md:text-sm font-normal max-w-2xl leading-relaxed text-center">
            {t.heroDescription}
          </p>

          <p className="mt-2 text-[#24c7ba] italic text-xs font-medium tracking-wide">
            {t.heroQuote}
          </p>
        </div>

        {/* Portal Entry Selection Cards */}
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 pt-3 pb-1 mt-6">
          {/* Citizen Entrance Card */}
          <button
            onClick={() => setShowCitizenModal(true)}
            className="group relative text-left bg-[#0c223a]/80 hover:bg-[#0f2a48]/90 transition-all duration-200 border border-slate-600/35 hover:border-teal-500/50 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#1b3a60] flex items-center justify-center text-teal-300 shadow-md mb-4 border border-blue-400/20">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                {t.citizenPortal}
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed font-normal pr-2">
                {t.citizenDescription}
              </p>
            </div>

            <div className="mt-6 pt-1">
              <span className="inline-flex items-center text-xs font-semibold text-[#20b8ab] group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all">
                <span>{t.citizenButton}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </span>
            </div>
          </button>

          {/* YB / Representative Entrance Card */}
          <button
            onClick={() => setShowYBModal(true)}
            className="group relative text-left bg-[#0c223a]/80 hover:bg-[#0f2a48]/90 transition-all duration-200 border border-slate-600/35 hover:border-teal-500/50 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#143e49] flex items-center justify-center text-teal-300 shadow-md mb-4 border border-teal-400/20">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                {t.ybPortal}
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed font-normal pr-2">
                {t.ybDescription}
              </p>
            </div>

            <div className="mt-6 pt-1">
              <span className="inline-flex items-center text-xs font-semibold text-[#20b8ab] group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all">
                <span>{t.ybButton}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </span>
            </div>
          </button>
        </div>
      </main>

      {/* =====================================================
          FOOTER SECTION
         ===================================================== */}
      <footer className="h-10 shrink-0 bg-[#040d18] border-t border-slate-800/80 px-6 lg:px-10 flex items-center justify-between text-[11px] text-slate-400 z-30">
        <p className="truncate">{t.footer}</p>

        <nav className="hidden sm:flex items-center space-x-3 text-slate-400">
          <button className="hover:text-slate-200">{t.privacy}</button>
          <span className="text-slate-600">•</span>
          <button className="hover:text-slate-200">{t.terms}</button>
          <span className="text-slate-600">•</span>
          <button className="hover:text-slate-200">{t.dataIntegrity}</button>
        </nav>
      </footer>

      {/* =====================================================
          FLOATING AI CHAT BUTTON
         ===================================================== */}
      <div className="fixed bottom-14 right-6 z-40 flex items-center space-x-3 group">
        <button
          onClick={toggleChatModal}
          className="hidden md:flex items-center bg-[#0d2238]/95 border border-teal-500/40 text-teal-300 text-xs font-medium px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md hover:bg-[#122e4d] hover:border-teal-400 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
          {t.chatButton}
        </button>

        <button
          aria-label={t.chatButton}
          onClick={toggleChatModal}
          className="relative w-14 h-14 p-3.5 bg-gradient-to-tr from-[#0d7f76] via-[#129c92] to-[#24c7ba] hover:scale-105 active:scale-95 text-white rounded-full shadow-xl border border-teal-300/30 flex items-center justify-center transition-all"
        >
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-300 border-2 border-[#051120]" />
          </span>
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      {/* =====================================================
          FLOATING CHAT WINDOW
         ===================================================== */}
      {showChat && (
        <div className="fixed bottom-14 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-[#0c1e33] border border-[#1b3d63] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Chat Window Header */}
          <div className="p-4 bg-[#08182b] border-b border-[#1b3d63] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">WaKiL AI</h3>
              <p className="text-[11px] text-[#20b8ab]">{t.chatSubtitle}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={resetChatFlow}
                title={t.chatRestart}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={toggleChatModal}
                title={t.chatClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Flow Container */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 text-xs"
          >
            {/* Initial Greeting Message */}
            <div className="bg-[#132c48] p-3.5 rounded-2xl rounded-tl-none border border-slate-700/50 text-slate-200">
              {t.chatWelcome}
            </div>

            {/* Quick Greeting Action Options */}
            {chatFlow.length === 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {t.chatGreetingOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectGreeting(i)}
                    className="p-2.5 text-left bg-[#102742] hover:bg-[#163558] border border-slate-700/60 hover:border-teal-500/50 rounded-xl text-teal-300 font-medium transition"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Dynamic Interactive Flow Log */}
            {chatFlow.map((msg, index) => (
              <div key={index} className="space-y-2">
                {/* User Message */}
                {msg.type === "user" && (
                  <div className="flex justify-end">
                    <div className="bg-[#129c92] text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] shadow">
                      {msg.content}
                    </div>
                  </div>
                )}

                {/* AI Text Response */}
                {msg.type === "ai" && (
                  <div className="bg-[#132c48] p-3.5 rounded-2xl rounded-tl-none border border-slate-700/50 text-slate-200 max-w-[90%] space-y-2">
                    <div>{msg.content}</div>

                    {/* Additional Option Pills */}
                    {msg.options && (
                      <div className="flex flex-col space-y-1.5 pt-2">
                        {msg.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectIssue(opt)}
                            className="text-left px-3 py-2 bg-[#0a192c] hover:bg-[#122e4d] border border-slate-700 rounded-lg text-teal-300 font-medium transition"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action Login Trigger */}
                    {msg.action === "login" && (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setShowChat(false);
                            setShowCitizenModal(true);
                          }}
                          className="w-full py-2 bg-[#129c92] hover:bg-[#0f877e] text-white font-semibold rounded-lg transition"
                        >
                          {t.loginButton}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline Complaint Form */}
                {msg.type === "form" && (
                  <div className="bg-[#10253e] p-4 rounded-2xl border border-teal-500/30 text-slate-200">
                    <h4 className="font-bold text-teal-300 mb-2">
                      {t.complaintDetails} ({msg.category})
                    </h4>
                    <form
                      onSubmit={(e) => handleSubmitComplaint(e, msg.category)}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">
                          {t.incidentLocation}
                        </label>
                        <input
                          type="text"
                          name="location"
                          placeholder={t.locationPlaceholder}
                          defaultValue={t.defaultLocation}
                          required
                          className="w-full bg-[#081524] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-teal-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">
                          {t.shortDescription}
                        </label>
                        <textarea
                          rows={2}
                          placeholder={t.descriptionPlaceholder}
                          defaultValue={t.defaultDescription}
                          className="w-full bg-[#081524] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-teal-400"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-[#129c92] hover:bg-[#0f877e] text-white font-bold rounded-lg transition"
                      >
                        {t.submitComplaint}
                      </button>
                    </form>
                  </div>
                )}

                {/* Complaint Submission Success Output */}
                {msg.type === "success" && (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl text-emerald-200 space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <Check className="w-4 h-4" />
                      <span>{t.complaintSuccess}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {t.successDescription}
                    </p>
                    <div className="bg-[#081524] p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1 text-slate-300">
                      <div>
                        <strong>{t.complaintID}</strong> #WKL-2026-8891
                      </div>
                      <div>
                        <strong>{t.category}</strong> {msg.category}
                      </div>
                      <div>
                        <strong>{t.location}</strong> {msg.location}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chat Input Dock */}
          <form
            onSubmit={handleUserSubmitInput}
            className="p-3 bg-[#08182b] border-t border-[#1b3d63] flex items-center space-x-2"
          >
            <button
              type="button"
              title={t.attach}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t.chatPlaceholder}
              className="flex-1 bg-[#0f243d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
            />
            <button
              type="button"
              title={t.voice}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="submit"
              title={t.send}
              className="p-2 bg-[#129c92] hover:bg-[#0f877e] text-white rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* =====================================================
          CITIZEN LOGIN MODAL
         ===================================================== */}
      {showCitizenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c1e33] border border-slate-700 w-full max-w-md rounded-2xl p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => setShowCitizenModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">
                {t.citizenLoginTitle}
              </h3>
              <p className="text-xs text-[#20b8ab]">
                {t.citizenLoginSubtitle}
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t.citizenLoginDescription}
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowCitizenModal(false);
                  navigate("/citizen");
                }}
                className="w-full py-3 bg-[#129c92] hover:bg-[#0f877e] text-white font-bold rounded-xl text-xs transition shadow-lg"
              >
                {t.continueMyDigitalID}
              </button>

              <button
                onClick={() => setShowCitizenModal(false)}
                className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs transition"
              >
                {t.checkStatusOnly}
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-800">
              {t.personalData}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          YB / REPRESENTATIVE LOGIN MODAL
         ===================================================== */}
      {showYBModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c1e33] border border-slate-700 w-full max-w-md rounded-2xl p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => setShowYBModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">{t.ybLoginTitle}</h3>
              <p className="text-xs text-[#20b8ab]">{t.ybLoginSubtitle}</p>
            </div>

            <div className="text-[11px] bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 text-slate-300">
              {t.restrictedAccess}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowYBModal(false);
                if (onLoginYB) onLoginYB();
              }}
              className="space-y-3 pt-1 text-xs"
            >
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  {t.officialEmail}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder={t.emailPlaceholder}
                    className="w-full bg-[#081524] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  {t.password}
                </label>
                <div className="relative">
                  <LockKeyhole className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={passwordVisible ? "text" : "password"}
                    required
                    placeholder={t.passwordPlaceholder}
                    className="w-full bg-[#081524] border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-white focus:outline-none focus:border-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((p) => !p)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {passwordVisible ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0"
                  />
                  <span>{t.rememberMe}</span>
                </label>
                <a href="#" className="text-teal-400 hover:underline">
                  {t.forgotPassword}
                </a>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#129c92] hover:bg-[#0f877e] text-white font-bold rounded-xl text-xs transition shadow-lg mt-2"
              >
                {t.loginDashboard}
              </button>
            </form>

            <div className="pt-2 text-center border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowYBModal(false);
                  if (onLoginYB) onLoginYB();
                }}
                className="text-xs text-teal-400 hover:underline"
              >
                {t.governmentMyDigitalID}
              </button>
              <p className="text-[10px] text-slate-500">{t.securityNotice}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}