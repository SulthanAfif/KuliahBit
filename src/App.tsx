import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLayoutEffect, useRef, useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Tugas from "./pages/Tugas";
import Flashcards from "./pages/Flashcards";
import Quiz from "./pages/Quiz";
import Ringkas from "./pages/Ringkas";
import Notes from "./pages/Notes";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import Agenda from "./pages/Agenda";
import Converter from "./pages/Converter";
import NilaiAkhir from "./pages/NilaiAkhir";
import Cram from "./pages/Cram";
import SlidePresentasi from "./pages/SlidePresentasi";
import CVBuilder from "./pages/CVBuilder";
import SuratKilat from "./pages/SuratKilat";
import Parafrase from "./pages/Parafrase";
import Citation from "./pages/Citation";
import Absensi from "./pages/Absensi";

function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
    window.scrollTo({ top: 0, left: 0 });
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 md:h-dvh md:flex-row md:overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen((open) => !open)} />
        <main ref={mainRef} className="min-h-0 w-full min-w-0 flex-1 p-4 sm:p-6 md:overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />
        <Route path="/tugas" element={<AppShell><Tugas /></AppShell>} />
        <Route path="/agenda" element={<AppShell><Agenda /></AppShell>} />
        <Route path="/flashcards" element={<AppShell><Flashcards /></AppShell>} />
        <Route path="/quiz" element={<AppShell><Quiz /></AppShell>} />
        <Route path="/ringkas" element={<AppShell><Ringkas /></AppShell>} />
        <Route path="/cram" element={<AppShell><Cram /></AppShell>} />
        <Route path="/notes" element={<AppShell><Notes /></AppShell>} />
        <Route path="/converter" element={<AppShell><Converter /></AppShell>} />
        <Route path="/nilai-akhir" element={<AppShell><NilaiAkhir /></AppShell>} />
        <Route path="/slides" element={<AppShell><SlidePresentasi /></AppShell>} />
        <Route path="/cv" element={<AppShell><CVBuilder /></AppShell>} />
        <Route path="/surat" element={<AppShell><SuratKilat /></AppShell>} />
        <Route path="/parafrase" element={<AppShell><Parafrase /></AppShell>} />
        <Route path="/citation" element={<AppShell><Citation /></AppShell>} />
        <Route path="/absensi" element={<AppShell><Absensi /></AppShell>} />
        <Route path="/pricing" element={<AppShell><Pricing /></AppShell>} />
        <Route path="/settings" element={<AppShell><Settings /></AppShell>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
