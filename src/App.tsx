// src/App.tsx
import React, { useEffect, useState } from "react";
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
import { Settings, Bot } from "lucide-react";

type ActiveModal = "settings" | "security" | "ai" | null;
type Tabs = "dashboard" | "tasks" | "calendar" | "goals";

function App() {
  const [activeTab, setActiveTab] = useState<Tabs>("dashboard");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // ⚙️ إعدادات عامة
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(
    "settings-darkMode",
    false
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

  // 🌐 لغة الواجهة
  const [language, setLanguage] = useLocalStorage<string>(
    "settings-language",
    "ar"
  );

  // 🔒 كلمة المرور
  const [appPassword, setAppPassword] = useLocalStorage<string | null>(
    "settings-app-password",
    null
  );
  const [appLockedSession, setAppLockedSession] = useState<boolean>(false);

  // 🌓 الوضع الليلي
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // 🔁 ضبط اتجاه المستند
  useEffect(() => {
    document.documentElement.setAttribute("lang", language === "ar" ? "ar" : "en");
  }, [language]);

  // 🗂️ البيانات
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

  // 🚪 بداية الجلسة
  useEffect(() => {
    if (appPassword) setAppLockedSession(true);
    else setAppLockedSession(false);
  }, [appPassword]);

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

  // ===========================
  // إدارة المهام (CRUD)
  // ===========================
  const handleTaskAdd = (newTask: Omit<Task, "id">) => {
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks((prev) => [...prev, task]);
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
    playReminderTone(reminderTone);
  };
  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  };

  // ===========================
  // إدارة التصنيفات
  // ===========================
  const getDefaultCategoryName = (cats: Category[]) => {
    return cats && cats.length > 0 ? cats[0].name : language === "ar" ? "عام" : "General";
  };

  const handleCategoryAdd = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newCat: Category = { id: Date.now().toString(), name: trimmed };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleCategoryUpdate = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
  };

  const handleCategoryDelete = (id: string) => {
    setCategories((prevCats) => {
      const toDelete = prevCats.find((c) => c.id === id);
      const newCats = prevCats.filter((c) => c.id !== id);
      const newDefault = getDefaultCategoryName(newCats);

      if (toDelete) {
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.category === toDelete.name ? { ...t, category: newDefault } : t
          )
        );
      }
      return newCats;
    });
  };

  // 🔐 شاشة القفل
  if (appLockedSession && appPassword) {
    return <LockScreen savedPassword={appPassword} onUnlock={() => setAppLockedSession(false)} />;
  }

  // التبويبات
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <Dashboard tasks={tasks} goals={goals} />
            {aiInsights && (
              <div className="m-4 p-4 border rounded-lg shadow border-blue-500">
                <h2 className="font-bold mb-2 text-blue-500">
                  🤖 {language === "ar" ? "تحليلات الذكاء الاصطناعي" : "AI Insights"}
                </h2>
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
            language={language}
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
            language={language}
          />
        );
      default:
        return <Dashboard tasks={tasks} goals={goals} />;
    }
  };

  // المودالات
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
          categories={categories}
          setCategories={setCategories}
          onAddCategory={handleCategoryAdd}
          onUpdateCategory={handleCategoryUpdate}
          onDeleteCategory={handleCategoryDelete}
          language={language}
          setLanguage={setLanguage}
          onOpenSecurity={() => setActiveModal("security")}
          onClose={() => setActiveModal(null)}
        />
      );
    }
    if (activeModal === "security") {
      return (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100">
            <h2 className="text-lg font-bold mb-4 text-blue-500">
              🔒 {language === "ar" ? "تأمين التطبيق" : "App Security"}
            </h2>
            <LockSettings password={appPassword} setPassword={setAppPassword} language={language} />
            <button
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full text-white py-2 rounded-lg bg-blue-500"
            >
              {language === "ar" ? "إغلاق" : "Close"}
            </button>
          </div>
        </div>
      );
    }
    if (activeModal === "ai") {
      return <AiModal onClose={() => setActiveModal(null)} language={language} />;
    }
    return null;
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
        fontSize === "small" ? "text-sm" : fontSize === "large" ? "text-lg" : "text-base"
      }`}
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
      />
      <main className="pb-20">{renderActiveTab()}</main>

      {/* ✅ أيقونات محسنة (إعدادات + AI) */}
      <BottomBar
        onOpenSettings={() => setActiveModal("settings")}
        onOpenAI={() => setActiveModal("ai")}
        language={language}
        settingsIcon={<Settings className="w-6 h-6" />}
        aiIcon={<Bot className="w-6 h-6" />}
      />

      {renderModal()}
    </div>
  );
}

export default App;
