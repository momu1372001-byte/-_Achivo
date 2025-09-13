import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TaskManager } from './components/TaskManager';
import { Calendar } from './components/Calendar';
import { Goals } from './components/Goals';
import { Task, Category, Goal } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialCategories, initialTasks, initialGoals } from './data/initialData';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // ✅ استخدم البيانات المخزنة إذا موجودة، وإلا استعمل initialData أول مرة بس
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    'productivity-tasks',
    localStorage.getItem('productivity-tasks') ? [] : initialTasks
  );

  const [categories, setCategories] = useLocalStorage<Category[]>(
    'productivity-categories',
    localStorage.getItem('productivity-categories') ? [] : initialCategories
  );

  const [goals, setGoals] = useLocalStorage<Goal[]>(
    'productivity-goals',
    localStorage.getItem('productivity-goals') ? [] : initialGoals
  );

  // ✅ إضافة مهمة جديدة
  const handleTaskAdd = (newTask: Omit<Task, 'id'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(), // معرف فريد
    };
    setTasks(prev => [...prev, task]);
  };

  // ✅ تحديث مهمة
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev =>
      prev.map(task => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  // ✅ حذف مهمة
  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // ✅ إضافة هدف جديد
  const handleGoalAdd = (newGoal: Omit<Goal, 'id'>) => {
    const goal: Goal = {
      ...newGoal,
      id: Date.now().toString(),
    };
    setGoals(prev => [...prev, goal]);
  };

  // ✅ تحديث هدف
  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoals(prev =>
      prev.map(goal => (goal.id === updatedGoal.id ? updatedGoal : goal))
    );
  };

  // ✅ هنا نحدد التبويب اللي يظهر
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tasks={tasks} goals={goals} />;
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
      {/* ✅ الهيدر */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ✅ المحتوى */}
      <main className="pb-8">{renderActiveTab()}</main>
    </div>
  );
}

export default App;
