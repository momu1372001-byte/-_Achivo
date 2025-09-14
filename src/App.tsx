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

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // ✅ استخدم البيانات المخزنة إذا وُجدت، وإلا استعمل initialData أول مرة
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

  // ✅ استدعاء API السيرفر عند تغيّر المهام
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

  // ✅ إضافة مهمة جديدة
  const handleTaskAdd = (newTask: Omit<Task, "id">) => {
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks((prev) => [...prev, task]);
  };

  // ✅ تحديث مهمة
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  // ✅ حذف مهمة
  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  // ✅ إضافة هدف جديد
  const handleGoalAdd = (newGoal: Omit<Goal, "id">) => {
    const goal: Goal = { ...newGoal, id: Date.now().toString() };
    setGoals((prev) => [...prev, goal]);
  };

  // ✅ تحديث هدف
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
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* الهيدر */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* المحتوى */}
      <main className="pb-8">{renderActiveTab()}</main>
    </div>
  );
}

export default App;
