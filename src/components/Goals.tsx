import React, { useState } from "react";
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  Award,
  CheckCircle,
} from "lucide-react";
import { Goal, Task } from "../types";

interface GoalsProps {
  goals: Goal[];
  tasks: Task[];
  onGoalAdd: (goal: Omit<Goal, "id">) => void;
  onGoalUpdate: (goal: Goal) => void;
  language: "ar" | "en"; // ✅ اللغة جاية من App
}

export const Goals: React.FC<GoalsProps> = ({
  goals,
  tasks,
  onGoalAdd,
  onGoalUpdate,
  language,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    target: 5,
    type: "daily" as const,
    category: language === "ar" ? "عام" : "General",
  });

  // ✅ الترجمات
  const translations = {
    ar: {
      title: "الأهداف",
      subtitle: "حدد أهدافك وتابع تقدمك",
      addGoal: "إضافة هدف جديد",
      totalGoals: "إجمالي الأهداف",
      achieved: "أهداف محققة",
      progressRate: "معدل الإنجاز",
      formTitle: "إضافة هدف جديد",
      goalTitle: "عنوان الهدف",
      goalTarget: "الهدف المطلوب",
      type: "النوع",
      daily: "يومي",
      weekly: "أسبوعي",
      category: "الفئة",
      save: "إضافة الهدف",
      cancel: "إلغاء",
      noGoals: "لا توجد أهداف بعد",
      start: "ابدأ بتحديد أهدافك لزيادة إنتاجيتك",
      completed: "تم تحقيق الهدف! 🎉",
      dailyGoal: "هدف يومي",
      weeklyGoal: "هدف أسبوعي",
    },
    en: {
      title: "Goals",
      subtitle: "Set your goals and track progress",
      addGoal: "Add New Goal",
      totalGoals: "Total Goals",
      achieved: "Achieved Goals",
      progressRate: "Progress Rate",
      formTitle: "Add New Goal",
      goalTitle: "Goal Title",
      goalTarget: "Target Value",
      type: "Type",
      daily: "Daily",
      weekly: "Weekly",
      category: "Category",
      save: "Save Goal",
      cancel: "Cancel",
      noGoals: "No goals yet",
      start: "Start by setting your goals to boost productivity",
      completed: "Goal Achieved! 🎉",
      dailyGoal: "Daily Goal",
      weeklyGoal: "Weekly Goal",
    },
  };

  const t = (key: keyof typeof translations["ar"]) =>
    translations[language][key];

  const handleAddGoal = () => {
    if (!newGoal.title.trim()) return;

    onGoalAdd({
      title: newGoal.title,
      target: newGoal.target,
      current: 0,
      type: newGoal.type,
      category: newGoal.category,
    });

    setNewGoal({
      title: "",
      target: 5,
      type: "daily",
      category: language === "ar" ? "عام" : "General",
    });
    setShowAddForm(false);
  };

  const calculateGoalProgress = (goal: Goal) => {
    const now = new Date();
    let relevantTasks: Task[];

    if (goal.type === "daily") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      relevantTasks = tasks.filter((task) => {
        const taskDate = task.dueDate
          ? new Date(task.dueDate)
          : new Date(task.createdAt);
        const taskDay = new Date(
          taskDate.getFullYear(),
          taskDate.getMonth(),
          taskDate.getDate()
        );
        return (
          taskDay.getTime() === today.getTime() &&
          task.category === goal.category &&
          task.completed
        );
      });
    } else {
      // Weekly
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      relevantTasks = tasks.filter((task) => {
        const taskDate = task.dueDate
          ? new Date(task.dueDate)
          : new Date(task.createdAt);
        return (
          taskDate >= startOfWeek &&
          task.category === goal.category &&
          task.completed
        );
      });
    }

    return relevantTasks.length;
  };

  const getGoalStatus = (goal: Goal) => {
    const current = calculateGoalProgress(goal);
    const percentage = (current / goal.target) * 100;

    if (percentage >= 100) return { status: "completed", color: "green" };
    if (percentage >= 75) return { status: "ontrack", color: "blue" };
    if (percentage >= 50) return { status: "progress", color: "yellow" };
    return { status: "behind", color: "red" };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>{t("addGoal")}</span>
        </button>
      </div>

      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">{t("totalGoals")}</p>
              <p className="text-3xl font-bold">{goals.length}</p>
            </div>
            <Target className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">{t("achieved")}</p>
              <p className="text-3xl font-bold">
                {goals.filter((goal) => calculateGoalProgress(goal) >= goal.target).length}
              </p>
            </div>
            <Award className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">{t("progressRate")}</p>
              <p className="text-3xl font-bold">
                {goals.length > 0
                  ? Math.round(
                      (goals.filter(
                        (goal) => calculateGoalProgress(goal) >= goal.target
                      ).length /
                        goals.length) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {t("formTitle")}
            </h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder={t("goalTitle")}
                value={newGoal.title}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder={t("goalTarget")}
                  value={newGoal.target}
                  onChange={(e) =>
                    setNewGoal({
                      ...newGoal,
                      target: parseInt(e.target.value) || 1,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />

                <select
                  value={newGoal.type}
                  onChange={(e) =>
                    setNewGoal({
                      ...newGoal,
                      type: e.target.value as "daily" | "weekly",
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">{t("daily")}</option>
                  <option value="weekly">{t("weekly")}</option>
                </select>
              </div>

              <input
                type="text"
                placeholder={t("category")}
                value={newGoal.category}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddGoal}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                {t("save")}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-6">
        {goals.map((goal) => {
          const current = calculateGoalProgress(goal);
          const percentage = Math.min((current / goal.target) * 100, 100);
          const status = getGoalStatus(goal);

          return (
            <div
              key={goal.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Target
                      className={`w-6 h-6 ${
                        status.color === "green"
                          ? "text-green-500"
                          : status.color === "blue"
                          ? "text-blue-500"
                          : status.color === "yellow"
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                    />
                    <h3 className="text-xl font-semibold text-gray-900">
                      {goal.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {goal.type === "daily" ? t("dailyGoal") : t("weeklyGoal")}
                    </span>
                    <span>
                      {t("category")}: {goal.category}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {current}/{goal.target}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      status.color === "green"
                        ? "text-green-600"
                        : status.color === "blue"
                        ? "text-blue-600"
                        : status.color === "yellow"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ease-out ${
                      status.color === "green"
                        ? "bg-gradient-to-r from-green-400 to-green-500"
                        : status.color === "blue"
                        ? "bg-gradient-to-r from-blue-400 to-blue-500"
                        : status.color === "yellow"
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                        : "bg-gradient-to-r from-red-400 to-red-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                {percentage >= 100 && (
                  <div className="flex items-center space-x-2 mt-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{t("completed")}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("noGoals")}
            </h3>
            <p className="text-gray-600 mb-4">{t("start")}</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              {t("addGoal")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
