import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TaskManager } from './components/TaskManager';
import { Calendar } from './components/Calendar';
import { Goals } from './components/Goals';
import { Task, Category, Goal } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialCategories, initialTasks, initialGoals } from './data/initialData';

// ✅ استدعاء OpenAI من المتصفح (اختبار)
import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const [tasks, setTasks] = useLocalStorage<Task[]>(
    'productivity-tasks',
    localStorage.getItem('productivity-tasks')
      ? JSON.parse(localStorage.getItem('productivity-tasks')!)
      : initialTasks
  );

  const [categories, setCategories] = useLocalStorage<Category[]>(
    'productivity-categories',
    localStorage.getItem('productivity-categories')
      ? JSON.parse(localStorage.getItem('productivity-categories')!)
      : initialCategories
  );

  const [goals, setGoals] = useLocalStorage<Goal[]>(
    'productivity-goals',
    localStorage.getItem('productivity-goals')
      ? JSON.parse(localStorage.getItem('productivity-goals')!)
      : initialGoals
  );

  // ✅ تحليلات المهام
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch("http://localhost:4000/ai-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: tasks.map(t => t.title) })
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

  // ✅ حقل سؤال مباشر لـ OpenAI
  const [userPrompt, setUserPrompt] = useState("");
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const handleAskAI = async () => {
    if (!userPrompt.trim()) return;
    setLoadingAI(true);
    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userPrompt }],
      });
      setAiReply(res.choices[0].message?.content || "لا يوجد رد");
    } catch (err: any) {
      setAiReply("❌ خطأ: " + (err.message || err));
    }
    setLoadingAI(false);
  };

  // ✅ إضافة مهمة
  const handleTaskAdd = (newTask: Omit<Task, 'id'>) => {
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks(prev => [...prev, task]);
  };

  // ✅ تحديث مهمة
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => (task.id === updatedTask.id ? updatedTask : task)));
  };

  // ✅ حذف مهمة
  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // ✅ إضافة هدف جديد
  const handleGoalAdd = (newGoal: Omit<Goal, 'id'>) => {
    const goal: Goal = { ...newGoal, id: Date.now().toString() };
    setGoals(prev => [...prev, goal]);
  };

  // ✅ تحديث هدف
  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoals(prev => prev.map(goal => (goal.id === updatedGoal.id ? updatedGoal : goal)));
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <Dashboard tasks={tasks} goals={goals} />

            {/* 🔹 تحليلات المهام بالذكاء الاصطناعي */}
            {aiInsights && (
              <div className="m-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow">
                <h2 className="text-lg font-bold mb-2">🤖 تحليلات الذكاء الاصطناعي</h2>
                <p className="text-gray-700">{aiInsights}</p>
              </div>
            )}

            {/* 🔹 صندوق سؤال مباشر للـ AI */}
            <div className="m-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-2">💬 اسأل الذكاء الاصطناعي</h2>
              <div className="flex flex-col gap-2">
                <textarea
                  className="border p-2 rounded"
                  rows={3}
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="اكتب سؤالك هنا..."
                />
                <button
                  onClick={handleAskAI}
                  disabled={loadingAI}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loadingAI ? "جاري التفكير..." : "أرسل"}
                </button>
                {aiReply && (
                  <div className="mt-2 text-gray-800 whitespace-pre-wrap">
                    {aiReply}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      case 'tasks':
        return (
          <TaskManager
            tasks={tasks}
            categories={categories}
            onTaskAdd={handleTaskAdd}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
          />
        );
      case 'calendar':
        return <Calendar tasks={tasks} />;
      case 'goals':
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
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pb-8">{renderActiveTab()}</main>
    </div>
  );
}

export default App;
