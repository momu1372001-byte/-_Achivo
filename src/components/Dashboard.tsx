// src/components/Dashboard.tsx
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Target, ClipboardList, PenTool, Clock } from "lucide-react";
import TaskManager from "./TaskManager";
import Notes from "./Notes";
import { Task, Goal, Category } from "../types";

// Recharts
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

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
  onOpenGoals?: () => void;
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
  onOpenGoals,
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
      type: "tasks" as const,
    },
    {
      title: t("الأهداف", "Goals"),
      value: goals.length,
      icon: Target,
      color: "from-green-500 to-emerald-500",
      type: "goals" as const,
    },
    {
      title: t("الملاحظات", "Notes"),
      value: notes.length,
      icon: PenTool,
      color: "from-purple-500 to-pink-500",
      type: "notes" as const,
    },
    {
      title: t("جلسات التركيز", "Pomodoro Sessions"),
      value: pomodoroSessions,
      icon: Clock,
      color: "from-orange-500 to-red-500",
      type: "pomodoro" as const,
    },
  ].filter((f) => f.value > 0);

  type Selected = null | "tasks" | "goals" | "notes";
  const [selectedFeature, setSelectedFeature] = useState<Selected>(null);

  // ---------- وظائف مساعدة ----------
  const isoToday = () => new Date().toISOString().split("T")[0];
  const daysBetweenInclusive = (s?: string, e?: string) => {
    if (!s || !e) return 0;
    const start = new Date(s);
    const end = new Date(e);
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  };
  const calcProgress = (g: any) => {
    if (!g?.startDate || !g?.endDate) return 0;
    const total = daysBetweenInclusive(g.startDate, g.endDate);
    const done = (g.completedDays || []).length || 0;
    return Math.min(100, Math.round((done / total) * 100));
  };

  // ---------- إحصائيات الأهداف ----------
  const stats = useMemo(() => {
    const total = (goals || []).length;
    const perGoal = (goals || []).map((g) => ({ ...g, __progress: calcProgress(g) }));
    const completedCount = perGoal.filter((g) => g.__progress >= 100).length;
    const avgProgress = total === 0 ? 0 : Math.round(perGoal.reduce((s, g) => s + (g.__progress || 0), 0) / total);

    const futureEnds = (goals || [])
      .map((g) => g.endDate)
      .filter(Boolean)
      .map((d) => new Date(d as string))
      .sort((a, b) => Number(a) - Number(b));

    const nearest = futureEnds.length > 0 ? futureEnds[0].toISOString().split("T")[0] : null;

    // Pie Chart data
    const pieData = [
      { name: t("منجز", "Completed"), value: completedCount },
      { name: t("غير منجز", "Not Completed"), value: total - completedCount },
    ];

    // Line chart data آخر 7 أيام
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const iso = d.toISOString().split("T")[0];
      const completed = perGoal.filter((g) => (g.completedDays || []).includes(iso)).length;
      return { date: iso, completed };
    });

    // Timeline
    const timeline = perGoal
      .map((g) => ({
        ...g,
        startDate: (goals.find(goal => goal.id === g.id)?.startDate) || "",
        endDate: (goals.find(goal => goal.id === g.id)?.endDate) || "",
      }))
      .slice()
      .sort((a, b) => new Date(a.startDate || "").getTime() - new Date(b.startDate || "").getTime());

    return { total, completedCount, avgProgress, nearest, perGoal, pieData, last7Days, timeline };
  }, [goals, language]);

  const COLORS = ["#22c55e", "#e5e7eb"]; // أخضر ورمادي

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
                  // ✅ تعديل السلوك: الفتح والإغلاق بالضغط نفسه
                  onClick={() =>
                    setSelectedFeature((prev) => (prev === feature.type ? null : feature.type))
                  }
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

          {/* صفحة الأهداف والإحصائيات */}
          {selectedFeature === "goals" && (
            <div className="w-full mb-8 space-y-6">
              {/* PieChart + LineChart + Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PieChart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{t("نسبة الإنجاز", "Completion Rate")}</h3>
                    <button
                      onClick={onOpenGoals}
                      className="px-3 py-1 rounded bg-blue-600 text-white"
                    >
                      {t("إضافة هدف", "Add Goal")}
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* LineChart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <h3 className="text-lg font-bold mb-4">{t("تطور الأهداف الأسبوعي", "Weekly Goal Progress")}</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={stats.last7Days}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <ReTooltip />
                      <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h3 className="text-lg font-bold mb-4">{t("خط زمني للأهداف", "Goals Timeline")}</h3>
                <ul className="space-y-3">
                  {stats.timeline.map((g) => (
                    <li key={g.id} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{g.startDate} → {g.endDate}</span>
                        <span className="font-medium">{g.title}</span>
                        <span className="text-xs">{g.__progress}%</span>
                      </div>
                      {/* شريط التقدم المحسن */}
                      <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-4 bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                          style={{ width: `${g.__progress}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
