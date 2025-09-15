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

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // ✅ إعدادات التطبيق (محفوظة في localStorage)
  const [darkMode, setDarkMode] = useLocalStorage<boolean>("settings-darkMode", false);
  const [themeColor, setThemeColor] = useLocalStorage<string>("settings-themeColor", "blue");
  const [fontSize, setFontSize] = useLocalStorage<string>("settings-fontSize", "normal");
  const [taskView, setTaskView] = useLocalStorage<string>("settings-taskView", "list");
  const [reminderTone, setReminderTone] = useLocalStorage<string>("settings-reminderTone", "default");
  const [minimalView, setMinimalView] = useLocalStorage<boolean>("settings-minimalView", false);

  // ✅ قفل التطبيق (بكلمة مرور)
  const [appLocked, setAppLocked] = useLocalStorage<boolean>("settings-appLocked", false);
  const [password, setPassword] = useLocalStorage<string>("settings-password", "1234");
  const [enteredPassword, setEnteredPassword] = useState("");

  // ✅ تطبيق Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // ✅ تطبيق لون الواجهة (themeColor) باستخدام CSS Variable
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-color", themeColor);
  }, [themeColor]);

  // ✅ البيانات (Tasks / Categories / Goals)
  const [tasks, setTasks] = useLocalStorage<Task[]>("productivity-tasks", initialTasks);
  const [categories, setCategories] = useLocalStorage<Category[]>("productivity-categories", initialCategories);
  const [goals, setGoals] = useLocalStorage<Goal[]>("productivity-goals", initialGoals);

  // ✅ تحليلات AI
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
      } catch (error) {
        console.error("خطأ في جلب تحليلات الذكاء الاصطناعي:", error);
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

  // ✅ التبويب النشط
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <Dashboard tasks={tasks} goals={goals} />
            {aiInsights && (
              <div className="m-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow">
                <h2 className="text-lg font-bold mb-2">🤖 تحليلات الذكاء الاصطناعي</h2>
                <p className="text-gray-700">{aiInsights}</p>
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

  // ✅ شاشة القفل (لو التطبيق مقفول)
  if (appLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-80">
          <h2 className="text-xl font-bold mb-4 text-center">🔒 التطبيق مقفول</h2>
          <input
            type="password"
            placeholder="أدخل كلمة المرور"
            value={enteredPassword}
            onChange={(e) => setEnteredPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <button
            onClick={() => {
              if (enteredPassword === password) {
                setAppLocked(false);
                setEnteredPassword("");
              } else {
                alert("❌ كلمة المرور غير صحيحة");
              }
            }}
            className="w-full bg-blue-500 text-white py-2 rounded-lg"
          >
            فتح التطبيق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${
        fontSize === "small" ? "text-sm" : fontSize === "large" ? "text-lg" : "text-base"
      }`}
      dir="rtl"
    >
      {/* ✅ الهيدر */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* المحتوى */}
      <main className="pb-20">{renderActiveTab()}</main>

      {/* ✅ الشريط السفلي */}
      <BottomBar onOpenSettings={() => setIsSettingsOpen(true)} onOpenAI={() => setIsAIOpen(true)} />

      {/* ✅ نافذة الإعدادات */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">⚙️ إعدادات التطبيق</h2>

            {/* الوضع الليلي */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 dark:text-gray-200">الوضع الليلي</span>
              <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
            </div>

            {/* قفل التطبيق */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 dark:text-gray-200">🔒 قفل التطبيق</span>
              <input type="checkbox" checked={appLocked} onChange={(e) => setAppLocked(e.target.checked)} />
            </div>
            <div className="mb-4">
              <span className="block mb-2 text-gray-700 dark:text-gray-200">كلمة المرور</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* لون الواجهة */}
            <div className="mb-4">
              <span className="block mb-2 text-gray-700 dark:text-gray-200">لون الواجهة</span>
              <div className="flex gap-2">
                {["blue", "green", "purple", "red"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setThemeColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      themeColor === color ? "border-black dark:border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* حجم الخط */}
            <div className="mb-4">
              <span className="block mb-2 text-gray-700 dark:text-gray-200">حجم الخط</span>
              <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full p-2 border rounded">
                <option value="small">صغير</option>
                <option value="normal">عادي</option>
                <option value="large">كبير</option>
              </select>
            </div>

            {/* نمط عرض المهام */}
            <div className="mb-4">
              <span className="block mb-2 text-gray-700 dark:text-gray-200">نمط عرض المهام</span>
              <select value={taskView} onChange={(e) => setTaskView(e.target.value)} className="w-full p-2 border rounded">
                <option value="list">قائمة</option>
                <option value="grid">شبكة</option>
              </select>
            </div>

            {/* العرض المختصر */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 dark:text-gray-200">📋 عرض مختصر للمهام</span>
              <input type="checkbox" checked={minimalView} onChange={(e) => setMinimalView(e.target.checked)} />
            </div>

            {/* نغمة التذكيرات */}
            <div className="mb-4">
              <span className="block mb-2 text-gray-700 dark:text-gray-200">نغمة التذكيرات</span>
              <select value={reminderTone} onChange={(e) => setReminderTone(e.target.value)} className="w-full p-2 border rounded">
                <option value="default">افتراضية</option>
                <option value="chime">🔔 Chime</option>
                <option value="beep">📢 Beep</option>
              </select>
            </div>

            <button onClick={() => setIsSettingsOpen(false)} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ✅ نافذة AI */}
      {isAIOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-4 rounded-t-2xl shadow-lg">
            <h2 className="text-lg font-bold mb-4">🤖 المساعد الذكي</h2>
            <p className="text-gray-600 dark:text-gray-300">هنا هيظهر مساعد AI (خطة يومية، نصائح، توليد أهداف...)</p>
            <button onClick={() => setIsAIOpen(false)} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg">
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
