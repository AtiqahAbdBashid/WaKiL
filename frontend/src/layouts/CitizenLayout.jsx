import { useState } from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/ui/Header";
import CitizenSidebar from "../components/citizen/CitizenSidebar";

export default function CitizenLayout() {
  const [language, setLanguage] = useState("bm");

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* SIDEBAR */}
      <CitizenSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* MAIN AREA */}
      <div className="flex-1 min-w-0">

        {/* HEADER */}
        <Header
          onMobileMenu={() => setMobileOpen(true)}
          language={language}
          setLanguage={setLanguage}
        />

        {/* PAGE CONTENT */}
        <main className="p-4 md:p-6 w-full">
          <Outlet context={{ language }} />
        </main>

      </div>
    </div>
  );
}