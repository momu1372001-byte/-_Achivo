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

  // ✅ البيانات المخزنة أو initialData
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    "productivity-tasks",
    localStorage.getItem("productivity-tasks")
      ? JSON.parse(localStorage.getItem("productivity-tasks")!)
      : initialTasks
  );

  const [categories, setCategories] = useLocalStorage<Category[]>(
    "productivity-categories",
    localStorage.getItem("productivity-categories")
      ? JSON.parse(localStorage.getItem("productivity-categories")!)
      : initialCategories
  );

  const [goals, setGoals] = useLocalStorage<Goal[]>(
    "productivity-goals",
    localStorage.getItem("productivity-goals")
      ? JSON.parse(localStorage.getItem("productivity-goals")!)
      : initialGoals
  );

  // ✅ حالة تحليلات الذكاء الاصطناعي
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

    if (tasks.length > 0) {
      fetchInsights();
    }
  }, [tasks]);

  // ✅ إضافة/تحديث/حذف المهام والأهداف
  const handleTaskAdd = (newTask: Omit<Task, "id">) => {
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks((prev) => [...prev, task]);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleGoalAdd = (newGoal: Omit<Goal, "id">) => {
    const goal: Goal = { ...newGoal, id: Date.now().toString() };
    setGoals((prev) => [...prev, goal]);
  };

  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal))
    );
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* ✅ الشريط العلوي */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* المحتوى */}
      <main className="pb-20">{renderActiveTab()}</main>

      {/* ✅ الشريط السفلي */}
      <BottomBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
      />

      {/* ✅ نافذة الإعدادات */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-4 rounded-t-2xl shadow-lg">
            <h2 className="text-lg font-bold mb-4">⚙️ إعدادات التطبيق</h2>
            <p className="text-gray-600 dark:text-gray-300">
              هنا هنضيف إعدادات مثل الوضع الليلي، الألوان، حجم الخط، إلخ...
            </p>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ✅ نافذة الذكاء الاصطناعي */}
      {isAIOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-4 rounded-t-2xl shadow-lg">
            <h2 className="text-lg font-bold mb-4">🤖 المساعد الذكي</h2>
            <p className="text-gray-600 dark:text-gray-300">
              هنا هيظهر مساعد AI (خطة يومية، نصائح، توليد أهداف...)
            </p>
            <button
              onClick={() => setIsAIOpen(false)}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
