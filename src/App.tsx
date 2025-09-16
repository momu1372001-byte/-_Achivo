// src/App.tsx
import  { useEffect, useState } from "react";
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

type ActiveModal = "settings" | "security" | "ai" | null;
type Tabs = "dashboard" | "tasks" | "calendar" | "goals";

function App() {
  const [activeTab, setActiveTab] = useState<Tabs>("dashboard");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // ⚙️ إعدادات عامة
  const [darkMode, setDarkMode] = useLocalStorage<boolean>("settings-darkMode", false);
  const [fontSize, setFontSize] = useLocalStorage<string>("settings-font-size", "normal");
  const [taskView, setTaskView] = useLocalStorage<"list" | "grid">("settings-task-view", "list");
  const [reminderTone, setReminderTone] = useLocalStorage<string>("settings-reminder-tone", "default");
  const [minimalView, setMinimalView] = useLocalStorage<boolean>("settings-minimal-view", false);

  // 🔒 كلمة المرور
  const [appPassword, setAppPassword] = useLocalStorage<string | null>("settings-app-password", null);
  const [appLockedSession, setAppLockedSession] = useState<boolean>(false);

  // 🌓 تفعيل الوضع الليلي
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // 🗂️ البيانات
  const [tasks, setTasks] = useLocalStorage<Task[]>("productivity-tasks", initialTasks);
  const [categories, setCategories] = useLocalStorage<Category[]>("productivity-categories", initialCategories);
  const [goals, setGoals] = useLocalStorage<Goal[]>("productivity-goals", initialGoals);

  // 🤖 AI Insights
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch("http://localhost:4000/ai-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: tasks.map((t) => t.title) }),
        });
        const data = await response.json();
        setAiInsights(data.insights || null);
      } catch {
        console.warn("⚠️ تعذّر الاتصال بسيرفر AI.");
      }
    };
    if (tasks.length > 0) fetchInsights();
  }, [tasks]);

  // 🚪 عند بداية الجلسة
  useEffect(() => {
    if (appPassword) setAppLockedSession(true);
    else setAppLockedSession(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================================
     🔔 تشغيل نغمة التذكيرات
  ================================= */
  const playReminderTone = (tone: string) => {
    let file = "/sounds/default.mp3";
    if (tone === "chime") file = "/sounds/chime.mp3";
    if (tone === "beep") file = "/sounds/beep.mp3";

    const audio = new Audio(file);
    audio.play().catch(() => console.warn("⚠️ تعذّر تشغيل الصوت"));
  };

  // 📋 إدارة المهام
  const handleTaskAdd = (newTask: Omit<Task, "id">) => {
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks((prev) => [...prev, task]);

    // ✅ تشغيل النغمة عند إضافة مهمة جديدة
    playReminderTone(reminderTone);
  };
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };
  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // 🎯 إدارة الأهداف
  const handleGoalAdd = (newGoal: Omit<Goal, "id">) => {
    const goal: Goal = { ...newGoal, id: Date.now().toString() };
    setGoals((prev) => [...prev, goal]);

    // ✅ تشغيل النغمة عند إضافة هدف
    playReminderTone(reminderTone);
  };
  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  };

  // 🔐 شاشة القفل
  if (appLockedSession && appPassword) {
    return <LockScreen savedPassword={appPassword} onUnlock={() => setAppLockedSession(false)} />;
  }

  // 📑 التبويبات
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <Dashboard tasks={tasks} goals={goals} />
            {aiInsights && (
              <div className="m-4 p-4 border rounded-lg shadow border-blue-500">
                <h2 className="font-bold mb-2 text-blue-500">🤖 تحليلات الذكاء الاصطناعي</h2>
                <p className="text-gray-700 dark:text-gray-300">{aiInsights}</p>
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
        return <Goals goals={goals} tasks={tasks} onGoalAdd={handleGoalAdd} onGoalUpdate={handleGoalUpdate} />;
      default:
        return <Dashboard tasks={tasks} goals={goals} />;
    }
  };

  // ⚙️ المودالات
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
          onOpenSecurity={() => setActiveModal("security")}
          onClose={() => setActiveModal(null)}
        />
      );
    }

    if (activeModal === "security") {
      return (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100">
            <h2 className="text-lg font-bold mb-4 text-blue-500">🔒 تأمين التطبيق</h2>
            <LockSettings password={appPassword} setPassword={setAppPassword} />
            <button onClick={() => setActiveModal(null)} className="mt-4 w-full text-white py-2 rounded-lg bg-blue-500">
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

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
        fontSize === "small" ? "text-sm" : fontSize === "large" ? "text-lg" : "text-base"
      }`}
      dir="rtl"
    >
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pb-20">{renderActiveTab()}</main>

      <BottomBar onOpenSettings={() => setActiveModal("settings")} onOpenAI={() => setActiveModal("ai")} />

      {renderModal()}
    </div>
  );
}

export default App;

/* ================================
   LockScreen
================================ */
const LockScreen = ({ savedPassword, onUnlock }: { savedPassword: string; onUnlock: () => void }) => {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center">🔒 التطبيق مقفول</h2>
        <input
          type="password"
          placeholder="أدخل كلمة المرور"
          value={entered}
          onChange={(e) => { setEntered(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
          className="w-full p-2 border rounded mb-3 dark:bg-gray-900"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button onClick={handleUnlock} className="w-full text-white py-2 rounded bg-blue-500">
          فتح التطبيق
        </button>
      </div>
    </div>
  );
};

/* ================================
   LockSettings
================================ */
const LockSettings = ({ password, setPassword }: { password: string | null; setPassword: (pw: string | null) => void }) => {
  const [mode, setMode] = useState<"setup" | "change" | "remove">(password ? "change" : "setup");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const reset = () => { setOldPw(""); setNewPw(""); setConfirmPw(""); };

  const handleCreate = () => {
    setMessage(null);
    if (!newPw || newPw.length < 4) {
      setMessage({ type: "err", text: "كلمة المرور قصيرة جداً" });
      return;
    }
    if (newPw !== confirmPw) {
      setMessage({ type: "err", text: "كلمتا المرور غير متطابقتين" });
      return;
    }
    setPassword(newPw);
    reset();
    setMessage({ type: "ok", text: "✅ تم إنشاء كلمة المرور" });
    setMode("change");
  };

  const handleChange = () => {
    if (oldPw !== password) {
      setMessage({ type: "err", text: "❌ كلمة المرور القديمة خاطئة" });
      return;
    }
    if (!newPw || newPw.length < 4) {
      setMessage({ type: "err", text: "كلمة المرور قصيرة جداً" });
      return;
    }
    if (newPw !== confirmPw) {
      setMessage({ type: "err", text: "كلمتا المرور غير متطابقتين" });
      return;
    }
    setPassword(newPw);
    reset();
    setMessage({ type: "ok", text: "✅ تم تغيير كلمة المرور" });
  };

  const handleRemove = () => {
    if (oldPw !== password) {
      setMessage({ type: "err", text: "❌ كلمة المرور خاطئة" });
      return;
    }
    setPassword(null);
    reset();
    setMode("setup");
    setMessage({ type: "ok", text: "✅ تم إلغاء كلمة المرور" });
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setMode("setup"); reset(); setMessage(null); }} className={`flex-1 py-2 rounded ${mode === "setup" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700"}`}>إنشاء</button>
        <button onClick={() => { setMode("change"); reset(); setMessage(null); }} className={`flex-1 py-2 rounded ${mode === "change" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700"}`}>تغيير</button>
        <button onClick={() => { setMode("remove"); reset(); setMessage(null); }} className={`flex-1 py-2 rounded ${mode === "remove" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700"}`}>إلغاء</button>
      </div>

      {mode === "setup" && (
        <div className="space-y-3">
          <input type="password" placeholder="كلمة المرور" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900" />
          <input type="password" placeholder="تأكيد كلمة المرور" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900" />
          <button onClick={handleCreate} className="w-full text-white py-2 rounded bg-blue-500">حفظ</button>
        </div>
      )}

      {mode === "change" && (
        <div className="space-y-3">
          <input type="password" placeholder="كلمة المرور الحالية" value={oldPw} onChange={(e) => setOldPw(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900" />
          <input type="password" placeholder="كلمة المرور الجديدة" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900" />
          <input type="password" placeholder="تأكيد الجديدة" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900" />
          <button onClick={handleChange} className="w-full text-white py-2 rounded bg-blue-500">تغيير</button>
        </div>
      )}

      {mode === "remove" && (
        <div className="space-y-3">
          <input type="password" placeholder="كلمة المرور الحالية" value={oldPw} onChange={(e) => setOldPw(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900" />
          <button onClick={handleRemove} className="w-full text-white py-2 rounded bg-blue-500">إلغاء التأمين</button>
        </div>
      )}

      {message && (
        <p className={`mt-3 text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};

/* ================================
   SettingsModal
================================ */
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
  onOpenSecurity,
  onClose,
}: any) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50">
      <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100">
        <h2 className="text-lg font-bold mb-4">⚙️ إعدادات التطبيق</h2>

        {/* الوضع الليلي */}
        <div className="flex items-center justify-between mb-4">
          <span>🌙 الوضع الليلي</span>
          <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
        </div>

        {/* حجم الخط */}
        <div className="mb-4">
          <span className="block mb-2">🔠 حجم الخط</span>
          <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900">
            <option value="small">صغير</option>
            <option value="normal">عادي</option>
            <option value="large">كبير</option>
          </select>
        </div>

        {/* عرض المهام */}
        <div className="mb-4">
          <span className="block mb-2">📋 نمط عرض المهام</span>
          <select value={taskView} onChange={(e) => setTaskView(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900">
            <option value="list">قائمة</option>
            <option value="grid">شبكة</option>
          </select>
        </div>

        {/* عرض مختصر */}
        <div className="flex items-center justify-between mb-4">
          <span>🔎 عرض مختصر</span>
          <input type="checkbox" checked={minimalView} onChange={(e) => setMinimalView(e.target.checked)} />
        </div>

        {/* نغمة التذكيرات */}
        <div className="mb-4">
          <span className="block mb-2">🔔 نغمة التذكيرات</span>
          <select value={reminderTone} onChange={(e) => setReminderTone(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900">
            <option value="default">افتراضية</option>
            <option value="chime">Chime</option>
            <option value="beep">Beep</option>
          </select>
        </div>

        {/* زر الأمان */}
        <button onClick={onOpenSecurity} className="w-full text-white py-2 rounded-lg mt-4 bg-blue-500">
          🔒 تأمين التطبيق
        </button>

        <button onClick={onClose} className="mt-4 w-full text-white py-2 rounded-lg bg-blue-500">
          إغلاق
        </button>
      </div>
    </div>
  );
};

/* ================================
   AiModal
================================ */
const AiModal = ({ onClose }: any) => (
  <div className="fixed inset-0 bg-black/40 flex items-end z-50">
    <div className="bg-white dark:bg-gray-800 w-full p-4 rounded-t-2xl shadow-lg text-gray-900 dark:text-gray-100">
      <h2 className="text-lg font-bold mb-4">🤖 المساعد الذكي</h2>
      <p className="text-gray-600 dark:text-gray-300">هنا ستظهر ميزات المساعد الذكي لاحقًا.</p>
      <button onClick={onClose} className="mt-4 w-full text-white py-2 rounded-lg bg-blue-500">
        إغلاق
      </button>
    </div>
  </div>
);
