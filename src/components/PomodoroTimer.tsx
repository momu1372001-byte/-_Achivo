// src/components/PomodoroTimer.tsx
import React, { useState, useEffect, useRef } from "react";

interface PomodoroProps {
  language?: "ar" | "en";
}

const PomodoroTimer: React.FC<PomodoroProps> = ({ language = "ar" }) => {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);

  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSecondsLeft(workMinutes * 60);
  }, [workMinutes]);

  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === 0) {
          if (mode === "work") {
            setMode("break");
            return breakMinutes * 60;
          } else {
            setMode("work");
            return workMinutes * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [isRunning, mode, workMinutes, breakMinutes]);

  const startPauseHandler = () => setIsRunning((prev) => !prev);

  const resetHandler = () => {
    setIsRunning(false);
    setMode("work");
    setSecondsLeft(workMinutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const progress =
    mode === "work"
      ? (secondsLeft / (workMinutes * 60)) * 100
      : (secondsLeft / (breakMinutes * 60)) * 100;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
      <h2 className="text-xl font-bold mb-4">
        {t("مؤقت بومودورو", "Pomodoro Timer")}
      </h2>

      {/* شريط دائري للتقدم */}
      <div className="relative w-40 h-40 mx-auto mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="12"
            className="text-gray-300"
            fill="transparent"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke={mode === "work" ? "#16a34a" : "#2563eb"} // أخضر للعمل - أزرق للاستراحة
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 70}
            strokeDashoffset={
              (2 * Math.PI * 70 * (100 - progress)) / 100
            }
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{formatTime(secondsLeft)}</span>
          <span className="text-sm text-gray-500">
            {mode === "work" ? t("عمل", "Work") : t("استراحة", "Break")}
          </span>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={startPauseHandler}
          className={`px-4 py-2 rounded-lg font-medium text-white ${
            isRunning ? "bg-yellow-500" : "bg-green-600"
          }`}
        >
          {isRunning ? t("إيقاف مؤقت", "Pause") : t("ابدأ", "Start")}
        </button>
        <button
          onClick={resetHandler}
          className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white"
        >
          {t("إعادة", "Reset")}
        </button>
      </div>

      {/* تخصيص الوقت */}
      <div className="grid grid-cols-2 gap-4">
        {/* وقت العمل */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("مدة العمل (دقائق)", "Work (min)")}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWorkMinutes((m) => Math.max(1, m - 1))}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={workMinutes}
              onChange={(e) => setWorkMinutes(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-900 dark:text-gray-100 text-center"
            />
            <button
              onClick={() => setWorkMinutes((m) => m + 1)}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
            >
              +
            </button>
          </div>
        </div>

        {/* وقت الاستراحة */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("مدة الاستراحة (دقائق)", "Break (min)")}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBreakMinutes((m) => Math.max(1, m - 1))}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-900 dark:text-gray-100 text-center"
            />
            <button
              onClick={() => setBreakMinutes((m) => m + 1)}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
