import { useEffect, useRef, useState } from "react";
import {
  Bell,
  User,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
} from "lucide-react";

export default function Header({
  onMobileMenu,
  language,
  setLanguage,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  // Logout
  const handleLogout = () => {
    setProfileOpen(false);
    setShowToast(true);

    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-30 px-4 md:px-6">

        {/* LEFT */}
        <div className="flex items-center gap-3">

          {/* Mobile menu */}
          <button
            onClick={onMobileMenu}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          {/* Logo */}
          <img
            src="/src/assets/wakilLogo.png"
            alt="WaKiL"
            className="h-9 w-auto object-contain"
          />

          {/* Tagline */}
          <span className="hidden md:inline-block text-xs text-slate-400 font-medium pl-3 border-l border-slate-200">
            Suara komuniti, tindakan nyata
          </span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2.5">

        {/* Language */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70 text-xs font-bold">

          {/* BM */}
          <button
            onClick={() => setLanguage("bm")}
            className={`
              px-2.5 py-1 rounded-lg transition
              ${
                language === "bm"
                  ? "bg-[#19a7a8] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }
            `}
          >
            BM
          </button>

          {/* EN */}
          <button
            onClick={() => setLanguage("en")}
            className={`
              px-2.5 py-1 rounded-lg transition
              ${
                language === "en"
                  ? "bg-[#19a7a8] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }
            `}
          >
            EN
          </button>

        </div>

          {/* Notification */}
          <button className="relative p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
            <Bell className="w-5 h-5" />

            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              3
            </span>
          </button>

          {/* Profile */}
          <div
            ref={profileRef}
            className="relative"
          >
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50">

                {/* User */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0c598c] to-[#0298a6] text-white flex items-center justify-center font-bold text-xs">
                    AR
                  </div>

                  <div className="min-w-0">

                    <h4 className="text-xs font-bold text-slate-900">
                      Ain Rahman
                    </h4>

                    <p className="text-[11px] text-slate-400">
                      Citizen account
                    </p>

                    <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#0c66a4] bg-blue-50 px-2 py-0.5 rounded-md">
                      P.108 Shah Alam
                    </span>

                  </div>
                </div>

                {/* Settings */}
                <div className="py-1">

                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-left">
                    <Settings className="w-4 h-4 text-slate-400" />

                    {language === "bm"
                      ? "Tetapan Akaun"
                      : "Account Settings"}
                  </button>

                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-left">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />

                    {language === "bm"
                      ? "Privasi & Keselamatan"
                      : "Privacy & Security"}
                  </button>

                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-1" />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />

                  {language === "bm"
                    ? "Log Keluar"
                    : "Logout"}
                </button>

              </div>
            )}
          </div>

        </div>
      </header>

      {/* Logout Toast */}
      {showToast && (
        <div className="fixed top-5 right-5 z-[100]">

          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-medium border border-slate-700">

            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              ✓
            </div>

            {language === "bm"
              ? "Anda telah berjaya log keluar."
              : "You have been successfully logged out."}

          </div>

        </div>
      )}
    </>
  );
}