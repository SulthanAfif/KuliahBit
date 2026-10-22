import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Tugas from "./pages/Tugas";
import Flashcards from "./pages/Flashcards";
import Quiz from "./pages/Quiz";
import Ringkas from "./pages/Ringkas";
import Skripsi from "./pages/Skripsi";
import Notes from "./pages/Notes";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import IPK from "./pages/IPK";
import Jadwal from "./pages/Jadwal";
import Pomodoro from "./pages/Pomodoro";
import Citation from "./pages/Citation";
import Agenda from "./pages/Agenda";
import Habit from "./pages/Habit";
import Absensi from "./pages/Absensi";
import Makalah from "./pages/Makalah";
import Converter from "./pages/Converter";
import SuratKilat from "./pages/SuratKilat";
import NilaiMinimal from "./pages/NilaiMinimal";
import NilaiAkhir from "./pages/NilaiAkhir";
import Prioritas from "./pages/Prioritas";
import Cram from "./pages/Cram";
import OutlineSlide from "./pages/OutlineSlide";
import Parafrase from "./pages/Parafrase";
import SlidePresentasi from "./pages/SlidePresentasi";
import CVBuilder from "./pages/CVBuilder";
import BankSoal from "./pages/BankSoal";
import FormatTugas from "./pages/FormatTugas";
import CariMateri from "./pages/CariMateri";

function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 md:h-dvh md:flex-row md:overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen((open) => !open)} />
        <main className="w-full min-w-0 flex-1 p-4 sm:p-6 md:overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/dashboard"
          element={
            <AppShell>
              <Dashboard />
            </AppShell>
          }
        />
        <Route path="/tugas" element={<AppShell><Tugas /></AppShell>} />
        <Route path="/jadwal" element={<AppShell><Jadwal /></AppShell>} />
        <Route path="/agenda" element={<AppShell><Agenda /></AppShell>} />
        <Route path="/flashcards" element={<AppShell><Flashcards /></AppShell>} />
        <Route path="/quiz" element={<AppShell><Quiz /></AppShell>} />
        <Route path="/ringkas" element={<AppShell><Ringkas /></AppShell>} />
        <Route path="/ipk" element={<AppShell><IPK /></AppShell>} />
        <Route path="/pomodoro" element={<AppShell><Pomodoro /></AppShell>} />
        <Route path="/habit" element={<AppShell><Habit /></AppShell>} />
        <Route path="/absensi" element={<AppShell><Absensi /></AppShell>} />
        <Route path="/makalah" element={<AppShell><Makalah /></AppShell>} />
        <Route path="/converter" element={<AppShell><Converter /></AppShell>} />
        <Route path="/surat" element={<AppShell><SuratKilat /></AppShell>} />
        <Route path="/nilai-minimal" element={<AppShell><NilaiMinimal /></AppShell>} />
        <Route path="/prioritas" element={<AppShell><Prioritas /></AppShell>} />
        <Route path="/cram" element={<AppShell><Cram /></AppShell>} />
        <Route path="/outline" element={<AppShell><OutlineSlide /></AppShell>} />
        <Route path="/slides" element={<AppShell><SlidePresentasi /></AppShell>} />
        <Route path="/cv" element={<AppShell><CVBuilder /></AppShell>} />
        <Route path="/bank" element={<AppShell><BankSoal /></AppShell>} />
        <Route path="/nilai-akhir" element={<AppShell><NilaiAkhir /></AppShell>} />
        <Route path="/format-tugas" element={<AppShell><FormatTugas /></AppShell>} />
        <Route path="/cari" element={<AppShell><CariMateri /></AppShell>} />
        <Route path="/parafrase" element={<AppShell><Parafrase /></AppShell>} />
        <Route path="/citation" element={<AppShell><Citation /></AppShell>} />
        <Route path="/skripsi" element={<AppShell><Skripsi /></AppShell>} />
        <Route path="/notes" element={<AppShell><Notes /></AppShell>} />
        <Route path="/pricing" element={<AppShell><Pricing /></AppShell>} />
        <Route path="/settings" element={<AppShell><Settings /></AppShell>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
