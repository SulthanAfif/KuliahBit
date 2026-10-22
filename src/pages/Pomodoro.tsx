import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, BookOpen } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";

type Mode = "focus" | "short" | "long";

const DEFAULTS = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

export default function Pomodoro() {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULTS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [todayFocus, setTodayFocus] = useState(0); // minutes
  const intervalRef = useRef<number | null>(null);

  // Load today's focus minutes
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const data = getFromStorage<{ date: string; minutes: number }>("pomodoro-today", {
      date: today,
      minutes: 0,
    });
    if (data.date === today) {
      setTodayFocus(data.minutes);
    }
  }, []);

  const saveTodayFocus = useCallback((mins: number) => {
    const today = new Date().toISOString().slice(0, 10);
    saveToStorage("pomodoro-today", { date: today, minutes: mins });
    setTodayFocus(mins);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          // Notification
          try {
            if (Notification.permission === "granted") {
              new Notification(
                mode === "focus" ? "Waktu fokus selesai! 🎉" : "Istirahat selesai!",
                {
                  body:
                    mode === "focus"
                      ? "Saatnya istirahat sebentar."
                      : "Siap fokus fokus lagi?",
                }
              );
            }
          } catch {}
          // Play beep via AudioContext if possible
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.value = 0.1;
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          } catch {}

          if (mode === "focus") {
            setSessions((s) => s + 1);
            saveTodayFocus(todayFocus + 25);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, todayFocus, saveTodayFocus]);

  const switchMode = (m: Mode) => {
    setIsRunning(false);
    setMode(m);
    setSecondsLeft(DEFAULTS[m]);
  };

  const toggle = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(DEFAULTS[mode]);
    }
    // Request notification permission on first start
    if (!isRunning && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setIsRunning(false);
    setSecondsLeft(DEFAULTS[mode]);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress =
    ((DEFAULTS[mode] - secondsLeft) / DEFAULTS[mode]) * 100;

  const modeLabel = {
    focus: "Fokus",
    short: "Istirahat Pendek",
    long: "Istirahat Panjang",
  };

  const modeColor = {
    focus: "text-red-500",
    short: "text-green-500",
    long: "text-blue-500",
  };

  const ringColor = {
    focus: "stroke-red-500",
    short: "stroke-green-500",
    long: "stroke-blue-500",
  };

  return (
    <div className="space-y-8 max-w-md mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <BookOpen className="text-red-500" size={26} />
          Focus Timer
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Teknik Pomodoro — fokus 25 menit, istirahat 5 menit
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 justify-center">
        {(
          [
            { id: "focus", label: "Fokus", icon: BookOpen },
            { id: "short", label: "Short", icon: Coffee },
            { id: "long", label: "Long", icon: Coffee },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => switchMode(m.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              mode === m.id
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="relative w-64 h-64 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-gray-100 dark:text-gray-800"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className={`transition-all duration-1000 ${ringColor[mode]}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className={`text-sm font-medium ${modeColor[mode]}`}>
            {modeLabel[mode]}
          </p>
          <p className="text-5xl font-bold tabular-nums tracking-tight mt-1">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={reset}
          className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title="Reset"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={toggle}
          className={`p-5 rounded-full text-white shadow-lg transition ${
            mode === "focus"
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
              : mode === "short"
              ? "bg-green-500 hover:bg-green-600 shadow-green-500/30"
              : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/30"
          }`}
        >
          {isRunning ? <Pause size={28} /> : <Play size={28} className="ml-0.5" />}
        </button>
        <div className="w-11" /> {/* spacer */}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-sm text-gray-500">Sesi hari ini</p>
          <p className="text-2xl font-bold mt-1">{sessions}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-sm text-gray-500">Fokus hari ini</p>
          <p className="text-2xl font-bold mt-1">{todayFocus} mnt</p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Tips: Matikan notifikasi HP saat mode fokus. Istirahat sejenak setiap 25 menit.
      </p>
    </div>
  );
}
