import React, { useState, useEffect } from "react";
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

// ======================= App ==========================
function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeModal, setActiveModal] = useState<"settings" | "security" | "ai" | null>(null);

  // ✅ إعدادات عامة
  const [darkMode, setDarkMode] = useLocalStorage("settings-darkMode", false);
  const [themeColor, setThemeColor] = useLocalStorage("settings-themeColor", "blue");
  const [fontSize, setFontSize] = useLocalStorage("settings-fontSize", "normal");
  const [taskView, setTaskView] = useLocalStorage("settings-taskView", "list");
  const [reminderTone, setReminderTone] = useLocalStorage("settings-reminderTone", "default");
  const [minimalView, setMinimalView] = useLocalStorage("settings-minimalView", false);

  // ✅ تأمين التطبيق
  const [appSecured, setAppSecured] = useLocalStorage("settings-appSecured", false);
  const [appPassword, setAppPassword] = useLocalStorage<string | null>("settings-appPassword", null);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ Dark Mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // ✅ Theme Color
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-color", themeColor);
  }, [themeColor]);

  // ✅ البيانات
  const [tasks, setTasks] = useLocalStorage<Task[]>("productivity-tasks", initialTasks);
  const [categories, setCategories] = useLocalStorage<Category[]>("productivity-categories", initialCategories);
  const [goals, setGoals] = useLocalStorage<Goal[]>("productivity-goals", initialGoals);

  // ✅ الذكاء الاصطناعي
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
        setAiInsights(data.insights);
      } catch {
        console.warn("⚠️ تعذر الاتصال بسيرفر الذكاء الاصطناعي.");
      }
    };
    if (tasks.length > 0) fetchInsights();
  }, [tasks]);

  // ✅ إدارة المهام
  const handleTaskAdd = (newTask: Omit<Task, "id">) => {
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks((prev) => [...prev, task]);
  };
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
  };
  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  // ✅ إدارة الأهداف
  const handleGoalAdd = (newGoal: Omit<Goal, "id">) => {
    const goal: Goal = { ...newGoal, id: Date.now().toString() };
    setGoals((prev) => [...prev, goal]);
  };
  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoals((prev) => prev.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal)));
  };

  // ✅ شاشة القفل
  if (appSecured && appPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-80">
          <h2 className="text-xl font-bold mb-4 text-center">🔒 التطبيق مقفول</h2>
          <input
            type="password"
            placeholder="كلمة المرور"
            value={enteredPassword}
            onChange={(e) => {
              setEnteredPassword(e.target.value);
              setErrorMessage("");
            }}
            className="w-full p-2 border rounded mb-2"
          />
          {errorMessage && <p className="text-red-500 text-sm mb-2">{errorMessage}</p>}
          <button
            onClick={() => {
              if (enteredPassword === appPassword) {
                setAppSecured(false);
                setEnteredPassword("");
              } else {
                setErrorMessage("❌ كلمة المرور غير صحيحة");
              }
            }}
            className="w-full bg-blue-500 text-white py-2 rounded-lg"
          >
            دخول
          </button>
        </div>
      </div>
    );
  }

  // ✅ التبويب النشط
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
        return <Goals goals={goals} tasks={tasks} onGoalAdd={handleGoalAdd} onGoalUpdate={handleGoalUpdate} />;
      default:
        return <Dashboard tasks={tasks} goals={goals} />;
    }
  };

  // ✅ المودالات (Modal Manager)
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
        <SecurityModal
          appPassword={appPassword}
          setAppPassword={setAppPassword}
          setAppSecured={setAppSecured}
          onClose={() => setActiveModal(null)}
        />
      );
    }
    if (activeModal === "ai") {
      return (
        <AiModal
          onClose={() => setActiveModal(null)}
        />
      );
    }
    return null;
  };

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

// ======================= Settings Modal ==========================
const SettingsModal = ({
  darkMode, setDarkMode,
  fontSize, setFontSize,
  taskView, setTaskView,
  minimalView, setMinimalView,
  reminderTone, setReminderTone,
  onOpenSecurity, onClose
}: any) => (
  <div className="fixed inset-0 bg-black/40 flex items-end z-50">
    <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">⚙️ إعدادات التطبيق</h2>

      {/* الوضع الليلي */}
      <div className="flex items-center justify-between mb-4">
        <span>الوضع الليلي</span>
        <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
      </div>

      {/* حجم الخط */}
      <div className="mb-4">
        <span className="block mb-2">حجم الخط</span>
        <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full p-2 border rounded">
          <option value="small">صغير</option>
          <option value="normal">عادي</option>
          <option value="large">كبير</option>
        </select>
      </div>

      {/* نمط عرض المهام */}
      <div className="mb-4">
        <span className="block mb-2">نمط عرض المهام</span>
        <select value={taskView} onChange={(e) => setTaskView(e.target.value)} className="w-full p-2 border rounded">
          <option value="list">قائمة</option>
          <option value="grid">شبكة</option>
        </select>
      </div>

      {/* العرض المختصر */}
      <div className="flex items-center justify-between mb-4">
        <span>📋 عرض مختصر</span>
        <input type="checkbox" checked={minimalView} onChange={(e) => setMinimalView(e.target.checked)} />
      </div>

      {/* نغمة التذكيرات */}
      <div className="mb-4">
        <span className="block mb-2">🔔 نغمة التذكيرات</span>
        <select value={reminderTone} onChange={(e) => setReminderTone(e.target.value)} className="w-full p-2 border rounded">
          <option value="default">افتراضية</option>
          <option value="chime">Chime</option>
          <option value="beep">Beep</option>
        </select>
      </div>

      <button onClick={onOpenSecurity} className="w-full bg-purple-600 text-white py-2 rounded-lg mt-4">
        🔒 تأمين التطبيق
      </button>

      <button onClick={onClose} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg">إغلاق</button>
    </div>
  </div>
);

// ======================= Security Modal ==========================
const SecurityModal = ({ appPassword, setAppPassword, setAppSecured, onClose }: any) => {
  const [mode, setMode] = useState<"setup" | "change" | "disable">(appPassword ? "change" : "setup");
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSetup = () => {
    if (!newPwd || newPwd.length < 4) return setError("❌ كلمة المرور قصيرة جداً");
    if (newPwd !== confirm) return setError("❌ غير متطابقة");
    setAppPassword(newPwd);
    setAppSecured(true);
    alert("✅ تم تعيين كلمة المرور");
    onClose();
  };

  const handleChange = () => {
    if (oldPwd !== appPassword) return setError("❌ كلمة المرور القديمة خاطئة");
    if (!newPwd || newPwd.length < 4) return setError("❌ كلمة المرور قصيرة جداً");
    if (newPwd !== confirm) return setError("❌ غير متطابقة");
    setAppPassword(newPwd);
    alert("✅ تم تغيير كلمة المرور");
    onClose();
  };

  const handleDisable = () => {
    if (oldPwd !== appPassword) return setError("❌ كلمة المرور غير صحيحة");
    setAppPassword(null);
    setAppSecured(false);
    alert("✅ تم إلغاء التأمين");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50">
      <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg">
        <h2 className="text-lg font-bold mb-4">🔒 إدارة التأمين</h2>
        {mode === "setup" && (
          <>
            <input type="password" placeholder="كلمة المرور" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="w-full p-2 border rounded mb-2" />
            <input type="password" placeholder="تأكيد كلمة المرور" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full p-2 border rounded mb-2" />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleSetup} className="w-full bg-green-600 text-white py-2 rounded-lg">تعيين</button>
          </>
        )}

        {mode === "change" && (
          <>
            <input type="password" placeholder="كلمة المرور القديمة" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} className="w-full p-2 border rounded mb-2" />
            <input type="password" placeholder="كلمة المرور الجديدة" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="w-full p-2 border rounded mb-2" />
            <input type="password" placeholder="تأكيد الجديدة" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full p-2 border rounded mb-2" />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleChange} className="w-full bg-yellow-500 text-white py-2 rounded-lg mb-2">تغيير</button>
            <button onClick={handleDisable} className="w-full bg-red-600 text-white py-2 rounded-lg">إلغاء التأمين</button>
          </>
        )}

        <button onClick={onClose} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg">إغلاق</button>
      </div>
    </div>
  );
};

// ======================= AI Modal ==========================
const AiModal = ({ onClose }: any) => (
  <div className="fixed inset-0 bg-black/40 flex items-end z-50">
    <div className="bg-white dark:bg-gray-800 w-full p-4 rounded-t-2xl shadow-lg">
      <h2 className="text-lg font-bold mb-4">🤖 المساعد الذكي</h2>
      <p className="text-gray-600 dark:text-gray-300">هنا هيظهر المساعد الذكي بخدمات مستقبلية...</p>
      <button onClick={onClose} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg">إغلاق</button>
    </div>
  </div>
);

export default App;
