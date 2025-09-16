// src/App.tsx
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

// نوع المودال النشط
type ActiveModal = "settings" | "security" | "ai" | "theme" | null;

function App() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "tasks" | "calendar" | "goals"
  >("dashboard");

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // ---------- إعدادات عامة ----------
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(
    "settings-darkMode",
    false
  );
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

  // ---------- تفعيل الثيم ----------
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.style.setProperty("--theme-color", themeColor);

    // الخلفية ثابتة عشان النص يبقى واضح
    document.body.style.backgroundColor = darkMode ? "#111827" : "#f9fafb";
    document.body.style.color = darkMode ? "#f9fafb" : "#111827";
  }, [darkMode, themeColor]);

  // ---------- بيانات ----------
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

  // ---------- ذكاء اصطناعي ----------
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
        console.warn("⚠️ تعذر الاتصال بسيرفر الذكاء الاصطناعي.");
      }
    };
    if (tasks.length > 0) fetchInsights();
  }, [tasks]);

  // ---------- إدارة المهام ----------
  const handleTaskAdd = (newTask: Omit<Task, "id">) => {
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks((prev) => [...prev, task]);
  };
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };
  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // ---------- إدارة الأهداف ----------
  const handleGoalAdd = (newGoal: Omit<Goal, "id">) => {
    const goal: Goal = { ...newGoal, id: Date.now().toString() };
    setGoals((prev) => [...prev, goal]);
  };
  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
  };

  // ---------- التبويب ----------
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <Dashboard tasks={tasks} goals={goals} />
            {aiInsights && (
              <div
                className="m-4 p-4 border rounded-lg shadow"
                style={{ borderColor: themeColor }}
              >
                <h2 className="font-bold mb-2" style={{ color: themeColor }}>
                  🤖 تحليلات الذكاء الاصطناعي
                </h2>
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

  // ---------- المودالات ----------
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
          onOpenTheme={() => setActiveModal("theme")}
          onClose={() => setActiveModal(null)}
        />
      );
    }
    if (activeModal === "theme") {
      return (
        <ThemeModal
          themeColor={themeColor}
          setThemeColor={setThemeColor}
          onClose={() => setActiveModal(null)}
        />
      );
    }
    if (activeModal === "ai") {
      return <AiModal onClose={() => setActiveModal(null)} />;
    }
    return null;
  };

  // ---------- الواجهة ----------
  return (
    <div
      className={`min-h-screen border-[6px]`}
      style={{
        borderColor: themeColor,
      }}
      dir="rtl"
    >
      <div
        className={`min-h-screen ${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        } ${
          fontSize === "small"
            ? "text-sm"
            : fontSize === "large"
            ? "text-lg"
            : "text-base"
        }`}
      >
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          themeColor={themeColor}
        />
        <main className="pb-20">{renderActiveTab()}</main>
        <BottomBar
          onOpenSettings={() => setActiveModal("settings")}
          onOpenAI={() => setActiveModal("ai")}
          themeColor={themeColor}
        />
        {renderModal()}
      </div>
    </div>
  );
}

export default App;

/* ============================
   SettingsModal
   ============================ */
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
  onOpenTheme,
  onClose,
}: any) => (
  <div className="fixed inset-0 bg-black/40 flex items-end z-50">
    <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">⚙️ إعدادات التطبيق</h2>

      <div className="flex items-center justify-between mb-4">
        <span>الوضع الليلي</span>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={(e) => setDarkMode(e.target.checked)}
        />
      </div>

      <div className="mb-4">
        <span className="block mb-2">حجم الخط</span>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="small">صغير</option>
          <option value="normal">عادي</option>
          <option value="large">كبير</option>
        </select>
      </div>

      <div className="mb-4">
        <span className="block mb-2">نمط عرض المهام</span>
        <select
          value={taskView}
          onChange={(e) => setTaskView(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="list">قائمة</option>
          <option value="grid">شبكة</option>
        </select>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span>📋 عرض مختصر</span>
        <input
          type="checkbox"
          checked={minimalView}
          onChange={(e) => setMinimalView(e.target.checked)}
        />
      </div>

      <div className="mb-4">
        <span className="block mb-2">🔔 نغمة التذكيرات</span>
        <select
          value={reminderTone}
          onChange={(e) => setReminderTone(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="default">افتراضية</option>
          <option value="chime">Chime</option>
          <option value="beep">Beep</option>
        </select>
      </div>

      <button
        onClick={onOpenTheme}
        className="w-full py-2 rounded-lg mt-4 text-white"
        style={{ backgroundColor: "var(--theme-color)" }}
      >
        🎨 نظام الألوان
      </button>

      <button
        onClick={onClose}
        className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg"
      >
        إغلاق
      </button>
    </div>
  </div>
);

/* ============================
   ThemeModal
   ============================ */
const ThemeModal = ({ themeColor, setThemeColor, onClose }: any) => {
  const colors = [
    "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
    "#6b7280", "#000000", "#ffffff",
  ];
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50">
      <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">🎨 اختر لون الواجهة</h2>
        <div className="grid grid-cols-6 gap-3 mb-4">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setThemeColor(color)}
              className={`w-10 h-10 rounded-full border-2 ${
                themeColor === color ? "border-black dark:border-white" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-lg text-white"
          style={{ backgroundColor: themeColor }}
        >
          تأكيد
        </button>
      </div>
    </div>
  );
};

/* ============================
   AiModal
   ============================ */
const AiModal = ({ onClose }: any) => (
  <div className="fixed inset-0 bg-black/40 flex items-end z-50">
    <div className="bg-white dark:bg-gray-800 w-full p-4 rounded-t-2xl shadow-lg">
      <h2 className="text-lg font-bold mb-4">🤖 المساعد الذكي</h2>
      <p className="text-gray-600 dark:text-gray-300">
        هنا هتظهر ميزات الذكاء الاصطناعي قريبًا...
      </p>
      <button
        onClick={onClose}
        className="mt-4 w-full py-2 rounded-lg text-white"
        style={{ backgroundColor: "var(--theme-color)" }}
      >
        إغلاق
      </button>
    </div>
  </div>
);
