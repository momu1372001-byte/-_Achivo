// src/components/Dashboard.tsx
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, ClipboardList, PenTool, Clock, ArrowLeft } from "lucide-react";
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
  notes: any[]; // array of notes
  pomodoroSessions?: number;
  language: "ar" | "en";
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskAdd: (task: Omit<Task, "id">) => void;
  setNotes: React.Dispatch<React.SetStateAction<any[]>>;
  onOpenGoals?: () => void;
  onOpenAddTask?: () => void;
  /** دالة لتحويل المستخدم إلى صفحة الملاحظات (تستخدمها زر "تسجيل ملاحظة") */
  onOpenNotes?: () => void;
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
  onOpenAddTask,
  onOpenNotes,
}) => {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);

  const hasData =
    tasks.length > 0 ||
    goals.length > 0 ||
    notes.length > 0 ||
    pomodoroSessions > 0;

  const features = [
    {
      title: t(" المهام", "Tasks"),
      value: tasks.length,
      icon: ClipboardList,
      color: "from-blue-500 via-indigo-500 to-violet-600",
      type: "tasks" as const,
    },
    {
      title: t("الأهداف", "Goals"),
      value: goals.length,
      icon: Target,
      color: "from-green-400 via-emerald-500 to-teal-500",
      type: "goals" as const,
    },
    {
      title: t("الملاحظات", "Notes"),
      value: notes.length,
      icon: PenTool,
      color: "from-pink-500 via-fuchsia-500 to-purple-600",
      type: "notes" as const,
    },
    {
      title: t("جلسات التركيز", "Pomodoro Sessions"),
      value: pomodoroSessions,
      icon: Clock,
      color: "from-orange-400 via-rose-500 to-red-600",
      type: "pomodoro" as const,
    },
  ].filter((f) => f.value > 0);

  // صفحات الإحصائيات
  const [showGoalStats, setShowGoalStats] = useState(false);
  const [showTaskStats, setShowTaskStats] = useState(false);

  // عرض ملاحظات داخل الداشبورد (عند الضغط على كارت الملاحظات)
  const [showNotesInline, setShowNotesInline] = useState(false);

  // دعم زر الرجوع لإغلاق أي view مفتوح
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (showNotesInline) {
        setShowNotesInline(false);
      } else if (showGoalStats) {
        setShowGoalStats(false);
      } else if (showTaskStats) {
        setShowTaskStats(false);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [showNotesInline, showGoalStats, showTaskStats]);

  // تواريخ مساعدة
  const isoDay = (d?: string | Date) => {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().split("T")[0];
  };

  const daysBetweenInclusive = (s?: string, e?: string) => {
    if (!s || !e) return 0;
    const start = new Date(s);
    const end = new Date(e);
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  };

  const calcGoalProgress = (g: any) => {
    if (!g?.startDate || !g?.endDate) return 0;
    const total = daysBetweenInclusive(g.startDate, g.endDate);
    const done = (g.completedDays || []).length || 0;
    return Math.min(100, Math.round((done / total) * 100));
  };

  // ---------- إحصائيات الأهداف ----------
  const goalStats = useMemo(() => {
    const total = (goals || []).length;
    const perGoal = (goals || []).map((g) => ({ ...g, __progress: calcGoalProgress(g) }));
    const completedCount = perGoal.filter((g) => g.__progress >= 100).length;
    const avgProgress = total === 0 ? 0 : Math.round(perGoal.reduce((s, g) => s + (g.__progress || 0), 0) / total);
    const futureEnds = (goals || [])
      .map((g) => g.endDate)
      .filter(Boolean)
      .map((d) => new Date(d as string))
      .sort((a, b) => Number(a) - Number(b));
    const nearest = futureEnds.length > 0 ? futureEnds[0].toISOString().split("T")[0] : null;
    const pieData = [
      { name: t("منجز", "Completed"), value: completedCount },
      { name: t("غير منجز", "Not Completed"), value: total - completedCount },
    ];
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const iso = d.toISOString().split("T")[0];
      const completed = perGoal.filter((g) => (g.completedDays || []).includes(iso)).length;
      return { date: iso, completed };
    });
    const timeline = perGoal.slice().sort((a, b) => new Date(a.startDate || "").getTime() - new Date(b.startDate || "").getTime());
    return { total, completedCount, avgProgress, nearest, perGoal, pieData, last7Days, timeline };
  }, [goals, language]);

  const GOAL_COLORS = ["#22c55e", "#e5e7eb"];

  // ---------- إحصائيات المهام ----------
  const taskStats = useMemo(() => {
    const total = (tasks || []).length;
    const statusCounts = {
      todo: tasks.filter((t) => t.status === "todo").length,
      "in-progress": tasks.filter((t) => t.status === "in-progress").length,
      done: tasks.filter((t) => t.status === "done").length,
    };
    const taskPie = [
      { name: "Todo", value: statusCounts.todo },
      { name: "In Progress", value: statusCounts["in-progress"] },
      { name: "Done", value: statusCounts.done },
    ];
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const iso = d.toISOString().split("T")[0];
      const completed = tasks.filter((task) => {
        if (task.status !== "done") return false;
        const completedAt = (task as any).completedAt ? isoDay((task as any).completedAt) : isoDay(task.createdAt);
        return completedAt === iso;
      }).length;
      return { date: iso, completed };
    });
    const timeline = (tasks || [])
      .map((t) => {
        const progress = t.status === "done" ? 100 : t.status === "in-progress" ? 50 : 0;
        return {
          id: t.id,
          title: t.title,
          createdAt: isoDay(t.createdAt),
          dueDate: t.dueDate ? isoDay(t.dueDate) : "",
          status: t.status,
          progress,
        };
      })
      .slice()
      .sort((a, b) => {
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return ad - bd;
      });
    return { total, statusCounts, taskPie, last7Days, timeline };
  }, [tasks]);

  const TASK_COLORS = ["#60a5fa", "#f59e0b", "#16a34a"];

  const openGoalStats = (open: boolean) => {
    if (open) window.history.pushState({}, "goal-stats");
    setShowGoalStats(open);
  };
  const openTaskStats = (open: boolean) => {
    if (open) window.history.pushState({}, "task-stats");
    setShowTaskStats(open);
  };

  // فتح عرض الملاحظات داخل الداشبورد (inline)
  const openNotesInline = (open: boolean) => {
    if (open) {
      try { window.history.pushState({}, "notes-inline"); } catch {}
    }
    setShowNotesInline(open);
  };

  // حذف ملاحظة (يعمل مباشرة من العرض المختصر)
  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  // ---------- صفحات الإحصائيات (كما سابقًا) ----------
  if (showGoalStats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        {/* ...نفس كود عرض إحصائيات الأهداف (احتفظت به كما كان) */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              openGoalStats(false);
              try { window.history.pushState({}, ""); } catch {}
            }}
            className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("رجوع", "Back")}
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t("إحصائيات الأهداف", "Goals Statistics")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{t("نسبة الإنجاز", "Completion Rate")}</h3>
              <button
                onClick={() => (onOpenGoals ? onOpenGoals() : alert(language === "ar" ? "افتح تبويب الأهداف لإضافة هدف." : "Open Goals tab to add a goal."))}
                className="px-3 py-1 rounded bg-blue-600 text-white"
              >
                {t("إضافة هدف", "Add Goal")}
              </button>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={goalStats.pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {goalStats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GOAL_COLORS[index % GOAL_COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-bold mb-4">{t("تطور الأهداف الأسبوعي", "Weekly Goal Progress")}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={goalStats.last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <ReTooltip />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mt-6">
          <h3 className="text-lg font-bold mb-4">{t("الخط الزمني للأهداف", "Goals Timeline")}</h3>
          <ul className="space-y-3">
            {goalStats.timeline.map((g: any) => (
              <li key={g.id} className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{g.startDate} → {g.endDate}</span>
                  <span className="font-medium">{g.title}</span>
                  <span className="text-xs">{g.__progress}%</span>
                </div>
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-4 bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500" style={{ width: `${g.__progress}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (showTaskStats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              openTaskStats(false);
              try { window.history.pushState({}, ""); } catch {}
            }}
            className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("رجوع", "Back")}
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t("إحصائيات المهام", "Tasks Statistics")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{t("حالة المهام", "Tasks Status")}</h3>
              <button
                onClick={() => (onOpenAddTask ? onOpenAddTask() : alert(language === "ar" ? "استخدم زر إضافة المهمة لفتح صفحة الإضافة." : "Use Add Task to open the add screen."))}
                className="px-3 py-1 rounded bg-blue-600 text-white"
              >
                {t("إضافة مهمة", "Add Task")}
              </button>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={taskStats.taskPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {taskStats.taskPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TASK_COLORS[index % TASK_COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="text-xs text-gray-500">{language === "ar" ? "قيد الانتظار" : "Todo"}</div>
                <div className="text-lg font-bold">{taskStats.statusCounts.todo}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">{language === "ar" ? "قيد التنفيذ" : "In Progress"}</div>
                <div className="text-lg font-bold">{taskStats.statusCounts["in-progress"]}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">{language === "ar" ? "منجزة" : "Done"}</div>
                <div className="text-lg font-bold">{taskStats.statusCounts.done}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-bold mb-4">{t("المهام المنجزة هذا الأسبوع", "Completed This Week")}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={taskStats.last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <ReTooltip />
                <Line type="monotone" dataKey="completed" stroke="#60a5fa" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 text-sm text-gray-500">
              {t("هذا الرسم يعرض عدد المهام التي وُصفت كـ 'منجزة' خلال آخر 7 أيام. لتحسين الدقة اضف completedAt لكل مهمة.", "This chart shows how many tasks were marked 'done' over the last 7 days. For better accuracy add a completedAt field.")}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mt-6">
          <h3 className="text-lg font-bold mb-4">{t("الخط الزمني للمهام", "Tasks Timeline")}</h3>
          <ul className="space-y-3">
            {taskStats.timeline.map((tItem: any) => (
              <li key={tItem.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500">{tItem.createdAt}{tItem.dueDate ? ` • ${tItem.dueDate}` : ""}</div>
                    <div className="font-medium">{tItem.title}</div>
                  </div>
                  <div className="text-sm text-gray-500">{tItem.status}</div>
                </div>

                <div className="w-full h-3 bg-gradient-to-r from-gray-200 to-gray-200 dark:from-gray-700 dark:to-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-3 rounded-full shadow-inner`}
                    style={{
                      width: `${tItem.progress}%`,
                      background: tItem.progress >= 100 ? "linear-gradient(90deg,#16a34a,#059669)" : `linear-gradient(90deg,#60a5fa,#7dd3fc)`,
                      transition: "width 400ms ease",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ---------- الواجهة الرئيسية للداشبورد ----------
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
      {!hasData ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <motion.div className="text-6xl mb-4" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>✨</motion.div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t("ابدأ رحلتك اليوم!", "Start your journey today!")}</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            {t("أضف هدفًا أو مهمة أو دوّن فكرة جديدة لتبدأ في تحقيق إنتاجيتك القصوى 💪", "Add a goal, a task, or jot down a new idea to unlock your productivity 💪")}
          </p>
        </motion.div>
      ) : (
        <div className="w-full max-w-6xl">
          {/* كروت الميزات */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              const handleClick = () => {
                if (feature.type === "goals") {
                  if (showGoalStats) openGoalStats(false);
                  else openGoalStats(true);
                } else if (feature.type === "tasks") {
                  if (showTaskStats) openTaskStats(false);
                  else openTaskStats(true);
                } else if (feature.type === "notes") {
                  // هنا السلوك المطلوب: عرض الملاحظات داخل الداشبورد
                  if (showNotesInline) openNotesInline(false);
                  else openNotesInline(true);
                } else {
                  // pomodoro or others - no-op for now
                }
              };

              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  onClick={handleClick}
                  className={`aspect-square p-6 rounded-2xl shadow-lg bg-gradient-to-br ${feature.color} text-white cursor-pointer relative overflow-hidden`}
                >
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-6 -left-10 w-56 h-56 rounded-full bg-white/10 blur-3xl opacity-30 transform rotate-45 animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-white/6 blur-xl opacity-20" />
                  </div>

                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-center">
                      <Icon className="w-10 h-10 opacity-95 drop-shadow-lg" />
                      <span className="text-4xl font-bold drop-shadow-md">{feature.value}</span>
                    </div>
                    <p className="mt-3 text-lg font-medium drop-shadow-sm">{feature.title}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ----- إذا اختار المستخدم عرض الملاحظات داخل الداشبورد ----- */}
          {showNotesInline && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openNotesInline(false)}
                    className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 rounded"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t("رجوع", "Back")}
                  </button>
                  <h3 className="text-lg font-bold">{t("الملاحظات", "Notes")}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => (onOpenNotes ? onOpenNotes() : alert(language === "ar" ? "افتح صفحة الملاحظات لتسجيل ملاحظة جديدة." : "Open the Notes page to register a new note."))}
                    className="px-3 py-2 rounded bg-blue-600 text-white"
                  >
                    {t("تسجيل ملاحظة", "Add Note")}
                  </button>
                </div>
              </div>

              {/* عرض بسيطة للملاحظات مع إمكانية الحذف السريع */}
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <p className="text-gray-500">{t("لا توجد ملاحظات", "No notes yet")}</p>
                ) : (
                  notes.map((note: any) => (
                    <div key={note.id} className="border rounded p-4 bg-gray-50 dark:bg-gray-900">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{note.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap mt-1">{note.content}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {t("أضيفت في", "Created at")}: {note.createdAt ? new Date(note.createdAt).toLocaleString(language === "ar" ? "ar-EG" : "en-US") : ""}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => (onOpenNotes ? onOpenNotes() : alert(language === "ar" ? "افتح صفحة الملاحظات لتحرير هذه الملاحظة." : "Open the Notes page to edit this note."))}
                            className="text-sm px-2 py-1 bg-yellow-200 rounded"
                          >
                            {t("تحرير", "Edit")}
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-sm px-2 py-1 bg-red-100 rounded text-red-600"
                          >
                            {t("حذف", "Delete")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* إن أردت تضمين مكونات إضافية داخل الداشبورد مكان الملاحظات، اترك مساحة هنا */}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
