// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { TaskManager } from "./components/TaskManager";
import { Calendar } from "./components/Calendar";
import { Goals } from "./components/Goals";
import { Task, Category, Goal } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import {
  initialCategories,
  initialTasks,
  initialGoals,
} from "./data/initialData";
import BottomBar from "./components/BottomBar";
import {
  Palette,
  X,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  Sun,
  Moon,
} from "lucide-react";

/**
 * App.tsx - كامل ومتكامل
 *
 * المزايا الأساسية المدمجة هنا:
 * - نظام ثيم (Theme System) متقدم: لوحة ألوان كبيرة، أيقونة لفتح اللوحة،
 *   اختيار لون مؤقت + زر تطبيق لتأكيد اللون (يُحفظ في localStorage).
 * - الوضع الليلي (dark mode) محفوظ
 * - تغيير حجم الخط وطرق عرض المهام محفوظة
 * - إدارة كلمة المرور (تحـــديث/إنشاء/إلغاء) مع رسائل نجاح/خطأ، ولا يحدث "قفل الجلسة" فور الحفظ
 * - شاشة القفل تظهر عند بداية الجلسة إذا كانت هناك كلمة مرور محفوظة
 * - يحافظ على كل الكود الأصلي والـ props للمكونات الأخرى
 *
 * ملاحظة تقنية: لتلوين العناصر بشكل عملي استخدمت CSS variable --theme-color.
 * تأكد أن لديك tailwind.config.js يحتوي على extend colors: { theme: "var(--theme-color)" }
 */

/* ------------------------
   Types for internal use
   ------------------------ */
type ActiveModal = "settings" | "security" | "ai" | null;
type Tabs = "dashboard" | "tasks" | "calendar" | "goals";

/* ------------------------
   Helper: مجموعة ألوان مبدئية
   (يمكنك توسيع القائمة بأي ألوان تريد)
   ------------------------ */
const DEFAULT_COLOR_PALETTE: string[] = [
  "#3b82f6", // blue-500
  "#2563eb",
  "#1d4ed8",
  "#6366f1", // indigo-500
  "#8b5cf6",
  "#a78bfa",
  "#ec4899", // pink-500
  "#f43f5e",
  "#fb7185",
  "#f97316", // orange-500
  "#fb923c",
  "#f59e0b", // amber-500
  "#eab308",
  "#f43f5e", // red
  "#ef4444",
  "#ef9776",
  "#22c55e", // green-400
  "#16a34a",
  "#14b8a6", // teal-400
  "#06b6d4", // cyan-400
  "#06b6d4",
  "#06b6d4",
  "#64748b", // slate
  "#0f172a", // dark
  "#000000",
  "#ffffff",
  "#a855f7",
  "#f0abfc",
  "#60a5fa",
  "#fca5a5",
];

/* ------------------------
   Main App component
   ------------------------ */
function App() {
  // -------------------
  // Tabs & modals
  // -------------------
  const [activeTab, setActiveTab] = useState<Tabs>("dashboard");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // -------------------
  // Settings (persistent via useLocalStorage)
  // -------------------
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(
    "settings-darkMode",
    false
  );

  // themeColor stored as hex string, default blue
  const [themeColor, setThemeColor] = useLocalStorage<string>(
    "settings-theme-color",
    "#3b82f6"
  );

  const [fontSize, setFontSize] = useLocalStorage<string>(
    "settings-font-size",
    "normal"
  );
  const [taskView, setTaskView] = useLocalStorage<"list" | "grid">(
    "settings-task-view",
    "list"
  );
  const [reminderTone, setReminderTone] = useLocalStorage<string>(
    "settings-reminder-tone",
    "default"
  );
  const [minimalView, setMinimalView] = useLocalStorage<boolean>(
    "settings-minimal-view",
    false
  );

  // -------------------
  // App security (password)
  // -------------------
  // stored password is plain text here (for demo). For production: store hash.
  const [appPassword, setAppPassword] = useLocalStorage<string | null>(
    "settings-app-password",
    null
  );
  // appLockedSession === true => during this browser session the lock-screen is active (until unlocked)
  const [appLockedSession, setAppLockedSession] = useState<boolean>(false);

  // -------------------
  // Apply theme and dark mode
  // -------------------
  useEffect(() => {
    // add/remove dark class
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    // set CSS variable for theme color
    // If themeColor is null/undefined set fallback
    const color = themeColor || "#3b82f6";
    document.documentElement.style.setProperty("--theme-color", color);
    // for compatibility with tailwind arbitrary usage, we might also set some CSS custom properties for shades if needed
  }, [themeColor]);

  // -------------------
  // Data (tasks / categories / goals)
  // -------------------
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    "productivity-tasks",
    initialTasks
  );
  const [categories, setCategories] = useLocalStorage<Category[]>(
    "productivity-categories",
    initialCategories
  );
  const [goals, setGoals] = useLocalStorage<Goal[]>(
    "productivity-goals",
    initialGoals
  );

  // -------------------
  // AI insights (best-effort)
  // -------------------
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  useEffect(() => {
    // best-effort; if server not available, ignore
    const fetchInsights = async () => {
      try {
        const res = await fetch("http://localhost:4000/ai-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: tasks.map((t) => t.title) }),
        });
        const data = await res.json();
        setAiInsights(data.insights || null);
      } catch (err) {
        // silently ignore
        setAiInsights(null);
      }
    };
    if (tasks.length) fetchInsights();
  }, [tasks]);

  // -------------------
  // On initial mount: if password exists, lock session (user must enter password)
  // Note: we do this only once on mount to avoid re-locking while user edits settings
  // -------------------
  useEffect(() => {
    // run only once
    if (appPassword) {
      setAppLockedSession(true);
    } else {
      setAppLockedSession(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------
  // Task handlers
  // -------------------
  const handleTaskAdd = (newTask: Omit<Task, "id">) => {
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks((prev) => [...prev, task]);
  };
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };
  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // -------------------
  // Goals handlers
  // -------------------
  const handleGoalAdd = (newGoal: Omit<Goal, "id">) => {
    const goal: Goal = { ...newGoal, id: Date.now().toString() };
    setGoals((prev) => [...prev, goal]);
  };
  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  };

  // -------------------
  // If app is locked at session start => show LockScreen
  // -------------------
  if (appLockedSession && appPassword) {
    return (
      <LockScreen
        savedPassword={appPassword}
        onUnlock={() => setAppLockedSession(false)}
      />
    );
  }

  // -------------------
  // Render main tab content
  // -------------------
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <Dashboard tasks={tasks} goals={goals} />
            {aiInsights && (
              <div className="m-4 p-4 bg-blue-50 border rounded-lg shadow">
                <h2 className="font-bold mb-2">🤖 تحليلات الذكاء الاصطناعي</h2>
                <p>{aiInsights}</p>
              </div>
            )}
          </>
        );
      case "tasks":
        return (
          <TaskManager
            tasks={tasks}
            categories={categories}
            onTaskAdd={handleTaskAdd}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            taskView={taskView}
            minimalView={minimalView}
          />
        );
      case "calendar":
        return <Calendar tasks={tasks} />;
      case "goals":
        return (
          <Goals
            goals={goals}
            tasks={tasks}
            onGoalAdd={handleGoalAdd}
            onGoalUpdate={handleGoalUpdate}
          />
        );
      default:
        return <Dashboard tasks={tasks} goals={goals} />;
    }
  };

  // -------------------
  // Render active modal (only one at a time)
  // -------------------
  const renderModal = () => {
    if (activeModal === "settings") {
      return (
        <SettingsModal
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          fontSize={fontSize}
          setFontSize={setFontSize}
          taskView={taskView}
          setTaskView={setTaskView}
          minimalView={minimalView}
          setMinimalView={setMinimalView}
          reminderTone={reminderTone}
          setReminderTone={setReminderTone}
          themeColor={themeColor}
          setThemeColor={setThemeColor}
          onOpenSecurity={() => setActiveModal("security")}
          onClose={() => setActiveModal(null)}
        />
      );
    }

    if (activeModal === "security") {
      return (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">🔒 تأمين التطبيق</h2>
            <LockSettings password={appPassword} setPassword={setAppPassword} />
            <button
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg"
            >
              إغلاق
            </button>
          </div>
        </div>
      );
    }

    if (activeModal === "ai") {
      return <AiModal onClose={() => setActiveModal(null)} />;
    }

    return null;
  };

  // -------------------
  // Main render
  // -------------------
  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${
        fontSize === "small" ? "text-sm" : fontSize === "large" ? "text-lg" : "text-base"
      }`}
      dir="rtl"
    >
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="pb-20">{renderActiveTab()}</main>

      <BottomBar
        onOpenSettings={() => setActiveModal("settings")}
        onOpenAI={() => setActiveModal("ai")}
      />

      {renderModal()}
    </div>
  );
}

export default App;

/* ======================================================
   LockScreen (داخل App.tsx)
   - تظهر عند بداية الجلسة إذا كانت كلمة مرور محفوظة
   - لا تحتوي على أي تأثير جانبي آخر (لا تُغلق التطبيق)
   ====================================================== */
const LockScreen = ({
  savedPassword,
  onUnlock,
}: {
  savedPassword: string;
  onUnlock: () => void;
}) => {
  const [entered, setEntered] = useState("");
  const [error, setError] = useState("");

  const handleUnlock = () => {
    if (entered === savedPassword) {
      setError("");
      onUnlock();
      setEntered("");
    } else {
      setError("❌ كلمة المرور غير صحيحة");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center">🔒 التطبيق مقفول</h2>

        <input
          aria-label="كلمة المرور"
          type="password"
          placeholder="أدخل كلمة المرور"
          value={entered}
          onChange={(e) => {
            setEntered(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUnlock();
          }}
          className="w-full p-2 border rounded mb-3 dark:bg-gray-900"
        />

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button
          onClick={handleUnlock}
          className="w-full bg-[var(--theme-color)] hover:opacity-95 text-white py-2 rounded"
          style={{ backgroundColor: "var(--theme-color)" }}
        >
          فتح التطبيق
        </button>

        <p className="text-xs text-gray-500 mt-3">أدخل كلمة المرور التي أنشأتها للوصول للتطبيق.</p>
      </div>
    </div>
  );
};

/* ======================================================
   LockSettings (داخل App.tsx)
   - إدارة كلمة المرور: إنشاء، تغيير، إلغاء
   - لا تُغلق التطبيق أو تقفل الجلسة فور الحفظ
   - تُظهر رسائل نجاح/خطأ داخل المكون
   ====================================================== */
const LockSettings = ({
  password,
  setPassword,
}: {
  password: string | null;
  setPassword: (pw: string | null) => void;
}) => {
  // modes: setup = create new; change = change existing; remove = delete existing
  const [mode, setMode] = useState<"setup" | "change" | "remove">(
    password ? "change" : "setup"
  );
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const resetInputs = () => {
    setOldPw("");
    setNewPw("");
    setConfirmPw("");
  };

  // Create new password
  const handleCreate = () => {
    setMessage(null);
    if (!newPw || newPw.length < 4) {
      setMessage({ type: "err", text: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" });
      return;
    }
    if (newPw !== confirmPw) {
      setMessage({ type: "err", text: "كلمتا المرور غير متطابقتين" });
      return;
    }
    setPassword(newPw);
    resetInputs();
    setMessage({ type: "ok", text: "✅ تم إنشاء كلمة المرور بنجاح — ستُطلب عند إعادة فتح التطبيق" });
    setMode("change");
  };

  // Change existing password
  const handleChange = () => {
    setMessage(null);
    if (!password) {
      setMessage({ type: "err", text: "لا توجد كلمة مرور حالية" });
      return;
    }
    if (oldPw !== password) {
      setMessage({ type: "err", text: "❌ كلمة المرور القديمة خاطئة" });
      return;
    }
    if (!newPw || newPw.length < 4) {
      setMessage({ type: "err", text: "كلمة المرور الجديدة قصيرة جدًا" });
      return;
    }
    if (newPw !== confirmPw) {
      setMessage({ type: "err", text: "كلمتا المرور غير متطابقتين" });
      return;
    }
    setPassword(newPw);
    resetInputs();
    setMessage({ type: "ok", text: "✅ تم تغيير كلمة المرور" });
  };

  // Remove password
  const handleRemove = () => {
    setMessage(null);
    if (!password) {
      setMessage({ type: "err", text: "لا توجد كلمة مرور ليتم إلغاؤها" });
      return;
    }
    if (oldPw !== password) {
      setMessage({ type: "err", text: "❌ كلمة المرور الحالية خاطئة" });
      return;
    }
    setPassword(null);
    resetInputs();
    setMode("setup");
    setMessage({ type: "ok", text: "✅ تم إلغاء كلمة المرور" });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => { setMode("setup"); setMessage(null); resetInputs(); }}
          className={`flex-1 py-2 rounded ${mode === "setup" ? "bg-[var(--theme-color)] text-white" : "bg-gray-100"}`}
          style={{ backgroundColor: mode === "setup" ? "var(--theme-color)" : undefined }}
        >
          إنشاء
        </button>
        <button
          onClick={() => { setMode("change"); setMessage(null); resetInputs(); }}
          className={`flex-1 py-2 rounded ${mode === "change" ? "bg-[var(--theme-color)] text-white" : "bg-gray-100"}`}
          style={{ backgroundColor: mode === "change" ? "var(--theme-color)" : undefined }}
        >
          تغيير
        </button>
        <button
          onClick={() => { setMode("remove"); setMessage(null); resetInputs(); }}
          className={`flex-1 py-2 rounded ${mode === "remove" ? "bg-[var(--theme-color)] text-white" : "bg-gray-100"}`}
          style={{ backgroundColor: mode === "remove" ? "var(--theme-color)" : undefined }}
        >
          إلغاء
        </button>
      </div>

      {mode === "setup" && (
        <div className="space-y-3">
          <input
            type="password"
            placeholder="كلمة المرور"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="تأكيد كلمة المرور"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button onClick={handleCreate} className="w-full bg-[var(--theme-color)] text-white py-2 rounded" style={{ backgroundColor: "var(--theme-color)" }}>
            حفظ
          </button>
        </div>
      )}

      {mode === "change" && (
        <div className="space-y-3">
          <input
            type="password"
            placeholder="كلمة المرور الحالية"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="كلمة المرور الجديدة"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="تأكيد الجديدة"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button onClick={handleChange} className="w-full bg-yellow-500 text-white py-2 rounded">
            تغيير
          </button>
        </div>
      )}

      {mode === "remove" && (
        <div className="space-y-3">
          <input
            type="password"
            placeholder="أدخل كلمة المرور الحالية لإلغاء التأمين"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button onClick={handleRemove} className="w-full bg-red-600 text-white py-2 rounded">
            إلغاء التأمين
          </button>
        </div>
      )}

      {message && (
        <p className={`mt-3 text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      <p className="text-xs text-gray-500 mt-2">
        ملاحظة: حفظ كلمة المرور لن يُقفل الجلسة الحالية. سيتم طلبها عند إعادة فتح التطبيق لاحقًا.
      </p>
    </div>
  );
};

/* ======================================================
   SettingsModal (داخل App.tsx) — محدث بلوحة ألوان مع أيقونة
   - يظهر زر أيقونة (Palette) داخل المودال
   - عند النقر على الأيقونة تظهر لوحة الألوان (overlay) صغيرة
   - يختار المستخدم لوناً مؤقتاً ثم يضغط "تطبيق اللون" لتأكيده
   - يوجد زر "استعادة الافتراضي" لإرجاع اللون الافتراضي
   ====================================================== */
const SettingsModal = ({
  darkMode,
  setDarkMode,
  fontSize,
  setFontSize,
  taskView,
  setTaskView,
  minimalView,
  setMinimalView,
  reminderTone,
  setReminderTone,
  themeColor,
  setThemeColor,
  onOpenSecurity,
  onClose,
}: any) => {
  // local state for color palette overlay & temp selection
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tempColor, setTempColor] = useState<string | null>(null);
  // ref for palette container so we can close on outside click
  const paletteRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // when palette opens, set tempColor to current theme for preview
    if (paletteOpen) {
      setTempColor(themeColor || "#3b82f6");
      // apply temporary preview
      document.documentElement.style.setProperty("--theme-color", tempColor || (themeColor || "#3b82f6"));
    } else {
      // when palette closes without confirm, ensure root has real themeColor
      document.documentElement.style.setProperty("--theme-color", themeColor || "#3b82f6");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteOpen]);

  // handle outside click to close palette (cancel)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!paletteOpen) return;
      if (!paletteRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!paletteRef.current.contains(e.target)) {
        // close palette and revert preview
        setPaletteOpen(false);
        document.documentElement.style.setProperty("--theme-color", themeColor || "#3b82f6");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [paletteOpen, themeColor]);

  // confirm applying selected color
  const applyTempColor = () => {
    if (!tempColor) return;
    setThemeColor(tempColor);
    setPaletteOpen(false);
  };

  const cancelTempColor = () => {
    // revert to stored theme
    setTempColor(null);
    setPaletteOpen(false);
    document.documentElement.style.setProperty("--theme-color", themeColor || "#3b82f6");
  };

  const resetToDefault = () => {
    const defaultColor = "#3b82f6";
    setThemeColor(defaultColor);
    setTempColor(null);
    setPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50">
      <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">⚙️ إعدادات التطبيق</h2>
          <div className="flex items-center gap-2">
            {/* theme preview small badge */}
            <div className="w-8 h-8 rounded flex items-center justify-center" title="معاينة اللون">
              <span className="inline-block w-6 h-6 rounded" style={{ backgroundColor: "var(--theme-color)" }} />
            </div>
            <button
              onClick={() => setPaletteOpen((s) => !s)}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="اختر لون الواجهة"
              aria-haspopup="true"
              aria-expanded={paletteOpen}
            >
              <Palette className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* content */}
        <div className="space-y-4">
          {/* dark mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span>الوضع الليلي</span>
            </div>
            <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
          </div>

          {/* font size */}
          <div>
            <label className="block mb-2">حجم الخط</label>
            <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full p-2 border rounded">
              <option value="small">صغير</option>
              <option value="normal">عادي</option>
              <option value="large">كبير</option>
            </select>
          </div>

          {/* task view */}
          <div>
            <label className="block mb-2">نمط عرض المهام</label>
            <select value={taskView} onChange={(e) => setTaskView(e.target.value)} className="w-full p-2 border rounded">
              <option value="list">قائمة</option>
              <option value="grid">شبكة</option>
            </select>
          </div>

          {/* minimal view */}
          <div className="flex items-center justify-between">
            <span>📋 عرض مختصر</span>
            <input type="checkbox" checked={minimalView} onChange={(e) => setMinimalView(e.target.checked)} />
          </div>

          {/* reminder tone */}
          <div>
            <label className="block mb-2">نغمة التذكيرات</label>
            <select value={reminderTone} onChange={(e) => setReminderTone(e.target.value)} className="w-full p-2 border rounded">
              <option value="default">افتراضية</option>
              <option value="chime">Chime</option>
              <option value="beep">Beep</option>
            </select>
          </div>

          {/* palette overlay (conditionally rendered) */}
          {paletteOpen && (
            <div className="mt-2">
              <div ref={paletteRef} className="bg-white dark:bg-gray-900 border p-3 rounded shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">اختر لونًا</h4>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => {
                        if (tempColor) {
                          document.documentElement.style.setProperty("--theme-color", tempColor);
                        }
                      }}
                      className="px-2 py-1 rounded border bg-gray-50"
                      title="معاينة آخر اختيار"
                    >
                      معاينة
                    </button>
                    <button onClick={resetToDefault} className="px-2 py-1 rounded border bg-gray-50" title="استعادة الافتراضي">
                      <RefreshCw className="w-4 h-4 inline" /> افتراضي
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {DEFAULT_COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setTempColor(color);
                        // temporary preview
                        document.documentElement.style.setProperty("--theme-color", color);
                      }}
                      className={`w-10 h-10 rounded-full border-2 ${tempColor === color ? "ring-2 ring-offset-1 ring-[var(--theme-color)]" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                      aria-label={`اختر اللون ${color}`}
                    />
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={applyTempColor}
                    className="flex-1 bg-[var(--theme-color)] text-white py-2 rounded"
                    style={{ backgroundColor: "var(--theme-color)" }}
                    aria-disabled={!tempColor}
                  >
                    تطبيق اللون
                  </button>
                  <button onClick={cancelTempColor} className="flex-1 bg-gray-100 py-2 rounded">
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* small note */}
          <p className="text-xs text-gray-500">
            اضغط على أيقونة لوحة الألوان لفتح لوحة الألوان. اختر لوناً ثم اضغط "تطبيق اللون" ليصبح لون الواجهة محفوظاً.
          </p>

          {/* security button */}
          <button onClick={onOpenSecurity} className="w-full bg-purple-600 text-white py-2 rounded-lg mt-2">
            🔒 تأمين التطبيق
          </button>

          {/* close button */}
          <button onClick={onClose} className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   AiModal (محلي)
   ====================================================== */
const AiModal = ({ onClose }: any) => (
  <div className="fixed inset-0 bg-black/40 flex items-end z-50">
    <div className="bg-white dark:bg-gray-800 w-full p-4 rounded-t-2xl shadow-lg">
      <h2 className="text-lg font-bold mb-4">🤖 المساعد الذكي</h2>
      <p className="text-gray-600 dark:text-gray-300">هنا ستظهر ميزات المساعد الذكي لاحقًا.</p>
      <button onClick={onClose} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg">إغلاق</button>
    </div>
  </div>
);
