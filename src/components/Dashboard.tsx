// src/components/Dashboard.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Target, ClipboardList, PenTool, Clock } from "lucide-react";
import TaskManager from "./TaskManager";
import Notes from "./Notes";
import { Task, Goal, Category } from "../types";

interface DashboardProps {
  tasks: Task[];
  goals: Goal[];
  categories: Category[];
  notes: any[];
  pomodoroSessions?: number;
  language: "ar" | "en";
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskAdd: (task: Omit<Task, "id">) => void;
  setNotes: React.Dispatch<React.SetStateAction<any[]>>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tasks,
  goals,
  categories,
  notes,
  pomodoroSessions = 0,
  language,
  onTaskUpdate,
  onTaskDelete,
  onTaskAdd,
  setNotes,
}) => {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);

  const hasData =
    tasks.length > 0 ||
    goals.length > 0 ||
    notes.length > 0 ||
    pomodoroSessions > 0;

  const features = [
    {
      title: t("المهام", "Tasks"),
      value: tasks.length,
      icon: ClipboardList,
      color: "from-blue-500 to-indigo-500",
      type: "tasks",
    },
    {
      title: t("الأهداف", "Goals"),
      value: goals.length,
      icon: Target,
      color: "from-green-500 to-emerald-500",
      type: "goals",
    },
    {
      title: t("الملاحظات", "Notes"),
      value: notes.length,
      icon: PenTool,
      color: "from-purple-500 to-pink-500",
      type: "notes",
    },
    {
      title: t("جلسات التركيز", "Pomodoro Sessions"),
      value: pomodoroSessions,
      icon: Clock,
      color: "from-orange-500 to-red-500",
      type: "pomodoro",
    },
  ].filter((f) => f.value > 0);

  const [selectedFeature, setSelectedFeature] = useState<null | "tasks" | "goals" | "notes">(null);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
      {!hasData ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {t("ابدأ رحلتك اليوم!", "Start your journey today!")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            {t(
              "أضف هدفًا أو مهمة أو دوّن فكرة جديدة لتبدأ في تحقيق إنتاجيتك القصوى 💪",
              "Add a goal, a task, or jot down a new idea to unlock your productivity 💪"
            )}
          </p>
        </motion.div>
      ) : (
        <div className="w-full max-w-6xl">
          {/* كروت الميزات */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-2xl shadow-lg bg-gradient-to-br ${feature.color} text-white cursor-pointer`}
                  onClick={() => setSelectedFeature(feature.type as any)}
                >
                  <div className="flex justify-between items-center">
                    <Icon className="w-10 h-10 opacity-90" />
                    <span className="text-4xl font-bold">{feature.value}</span>
                  </div>
                  <p className="mt-3 text-lg font-medium">{feature.title}</p>
                </motion.div>
              );
            })}
          </div>

          {/* تفاصيل المهام أو الأهداف أو الملاحظات */}
          {selectedFeature === "tasks" && (
            <div className="w-full mb-8">
              <TaskManager
                tasks={tasks}
                categories={categories}
                onTaskUpdate={onTaskUpdate}
                onTaskDelete={onTaskDelete}
                onTaskAdd={onTaskAdd}
                language={language}
              />
              <button
                onClick={() => setSelectedFeature(null)}
                className="mt-4 px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {t("إغلاق المهام", "Close Tasks")}
              </button>
            </div>
          )}

          {selectedFeature === "goals" && (
            <div className="w-full mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h3 className="text-xl font-bold mb-4">{t("الأهداف", "Goals")}</h3>
                {goals.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-300">{t("لا توجد أهداف مسجلة", "No goals recorded")}</p>
                ) : (
                  goals.map((goal) => (
                    <div key={goal.id} className="p-4 mb-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{goal.title}</h4>
                      <p className="text-gray-600 dark:text-gray-300">{(goal as any).description ?? ""}</p>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="mt-4 px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {t("إغلاق الأهداف", "Close Goals")}
              </button>
            </div>
          )}

          {selectedFeature === "notes" && (
            <div className="w-full mb-8">
              <Notes {...({ language, notes, setNotes } as any)} />
              <button
                onClick={() => setSelectedFeature(null)}
                className="mt-4 px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {t("إغلاق الملاحظات", "Close Notes")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
