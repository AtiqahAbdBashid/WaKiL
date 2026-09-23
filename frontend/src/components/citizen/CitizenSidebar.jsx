import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Bot,
  Bell,
  User,
  Repeat2,
  Menu,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/citizen",
  },
  {
    label: "Hantar Aduan",
    icon: PlusCircle,
    path: "/citizen/report",
  },
  {
    label: "Aduan Saya",
    icon: ClipboardList,
    path: "/citizen/reports",
  },
  {
    label: "WaKiL AI Chat",
    icon: Bot,
    path: "/citizen/ai",
    smart: true,
  },
  {
    label: "Notifikasi",
    icon: Bell,
    path: "/citizen/notifications",
    badge: 3,
  },
  {
    label: "Profil Saya",
    icon: User,
    path: "/citizen/profile",
  },
];

export default function CitizenSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (item) => {
    navigate(item.path);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:sticky
          top-0 left-0
          z-50
          h-screen
          bg-white
          border-r border-slate-200/80
          flex flex-col
          justify-between
          shrink-0
          overflow-hidden
          transition-all duration-300

          ${collapsed ? "lg:w-[72px]" : "lg:w-[264px]"}
          ${
            mobileOpen
              ? "translate-x-0 w-[264px]"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* TOP */}
        <div className="p-4">

          {/* Logo + Toggle */}
          <div
            className={`
              flex items-center gap-2 mb-5
              ${collapsed ? "justify-center" : "justify-between"}
            `}
          >
            {!collapsed && (
              <div className="flex items-center gap-2">
                <img
                  src="/src/assets/wakilLogo.png"
                  alt="WaKiL"
                  className="h-9 w-auto object-contain"
                />
              </div>
            )}

            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileOpen(false);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Portal */}
          {!collapsed && (
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-cyan-50 text-[#0298a6] text-[11px] font-bold tracking-wider rounded-md">
                CITIZEN PORTAL
              </span>
            </div>
          )}

          {/* NAVIGATION */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              const active =
                item.path === "/citizen"
                  ? location.pathname === "/citizen"
                  : location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item)}
                  title={item.label}
                  className={`
                    w-full
                    flex items-center
                    ${collapsed ? "justify-center" : "justify-between"}
                    px-3 py-2.5
                    rounded-xl
                    transition
                    text-sm font-semibold

                    ${
                      active
                        ? "bg-blue-50/80 text-[#0c4a7e]"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`
                        w-5 h-5 shrink-0

                        ${
                          active
                            ? "text-[#0c4a7e]"
                            : item.label === "Hantar Aduan"
                            ? "text-[#0f9479]"
                            : item.label === "Aduan Saya"
                            ? "text-blue-600"
                            : item.label === "WaKiL AI Chat"
                            ? "text-purple-600"
                            : "text-slate-600"
                        }
                      `}
                    />

                    {!collapsed && (
                      <span className="whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!collapsed && item.smart && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold">
                      Smart
                    </span>
                  )}

                  {!collapsed && item.badge && (
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-bold">
                      {item.badge}
                    </span>
                  )}

                  {collapsed && item.badge && (
                    <span className="absolute ml-5 -mt-5 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[8px] flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM */}
        <div className="p-3 border-t border-slate-100">

          {/* Tukar Portal */}
          <button
            className={`
              w-full flex items-center
              ${collapsed ? "justify-center" : ""}
              gap-3
              text-slate-600
              hover:text-slate-900
              text-xs font-semibold
              px-2 py-2 mb-3
              rounded-lg
              hover:bg-slate-50
              transition
            `}
          >
            <Repeat2 className="w-4 h-4 text-slate-500 shrink-0" />

            {!collapsed && (
              <span>Tukar portal</span>
            )}
          </button>

          {/* Profile */}
          <div
            className={`
              flex items-center
              ${collapsed ? "justify-center" : ""}
              gap-2.5
              p-2
              rounded-xl
              bg-slate-50/60
              border border-slate-100
              overflow-hidden
            `}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0c598c] to-[#0298a6] text-white flex items-center justify-center font-bold text-xs shrink-0">
              AR
            </div>

            {!collapsed && (
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  Ain Rahman
                </h4>

                <p className="text-[11px] text-slate-400 font-medium">
                  Citizen account
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}