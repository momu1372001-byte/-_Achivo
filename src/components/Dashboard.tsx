import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Clock,
  Calendar,
  Award,
  AlertTriangle,
  Flame,
  Trophy,
  Bell,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { Task, Goal } from '../types';

interface DashboardProps {
  tasks: Task[];
  goals: Goal[];
  language: string; // 👈 إضافة اللغة
}

// 🔹 Hook للذكاء الاصطناعي
const useAIInsights = (tasks: Task[], language: string) => {
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch("http://localhost:4000/ai-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks }),
        });
        const data = await res.json();
        setInsights(data.insights);
      } catch (err) {
        console.warn("⚠️ لم أستطع الاتصال بالسيرفر، هيتم استخدام اقتراحات محلية.");
        // fallback محلي
        const suggestions: string[] = [];
        const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < new Date());
        if (overdue.length > 0)
          suggestions.push(language === "ar" ? 
            `⚠️ لديك ${overdue.length} مهمة متأخرة! حاول إنجازها أولًا.` :
            `⚠️ You have ${overdue.length} overdue tasks! Try finishing them first.`);

        const upcoming = tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate >= new Date());
        if (upcoming.length > 0)
          suggestions.push(language === "ar" ? 
            `⏰ استعد لمهامك القادمة: ${upcoming[0].title}` :
            `⏰ Prepare for your upcoming task: ${upcoming[0].title}`);

        const done = tasks.filter(t => t.status === 'done');
        if (done.length > 0)
          suggestions.push(language === "ar" ? 
            `✅ لقد أنجزت ${done.length} مهمة! أحسنت 👍` :
            `✅ You have completed ${done.length} tasks! Great job 👍`);

        setInsights(suggestions);
      }
    };

    if (tasks.length > 0) fetchInsights();
  }, [tasks, language]);

  return insights;
};

export const Dashboard: React.FC<DashboardProps> = ({ tasks, goals, language }) => {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);

  // 🔹 تقسيم المهام
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
  const todoTasks = tasks.filter((t) => t.status === 'todo');

  // 🔹 المهام المتأخرة
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < new Date() && t.status !== 'done'
  );

  // 🔹 معدل الإنجاز
  const completionRate =
    tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  // 🔹 توزيع المهام PieChart
  const pieData = [
    { name: t("منجزة", "Done"), value: doneTasks.length, color: '#22c55e' },
    { name: t("قيد التنفيذ", "In progress"), value: inProgressTasks.length, color: '#3b82f6' },
    { name: t("متبقية", "Remaining"), value: todoTasks.length, color: '#a1a1aa' },
  ];

  // 🔹 إنتاجية الأسبوع BarChart
  const weekDays = language === "ar"
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const weeklyData = weekDays.map((day, i) => {
    const dayTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate.getDay() === i && t.status === 'done'
    );
    return { day, value: dayTasks.length };
  });

  // 🔹 Upcoming Tasks
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate && t.dueDate >= new Date())
      .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())
      .slice(0, 5);
  }, [tasks]);

  // 🔹 Streaks
  const streak = useMemo(() => {
    let currentStreak = 0;
    let date = new Date();
    while (true) {
      const dayTasks = doneTasks.filter(
        (t) => t.dueDate && t.dueDate.toDateString() === date.toDateString()
      );
      if (dayTasks.length > 0) {
        currentStreak++;
        date.setDate(date.getDate() - 1);
      } else break;
    }
    return currentStreak;
  }, [doneTasks]);

  // 🔹 Achievements
  const achievements = [];
  if (doneTasks.length >= 10)
    achievements.push({
      title: t("أنجزت 10 مهام!", "Completed 10 tasks!"),
      icon: Trophy,
      color: 'text-yellow-600',
    });
  if (streak >= 3)
    achievements.push({
      title: t(`🔥 سلسلة ${streak} أيام!`, `🔥 ${streak}-day streak!`),
      icon: Flame,
      color: 'text-red-600',
    });

  // 🔹 AI Insights
  const aiInsights = useAIInsights(tasks, language);

  // ✅ إشعارات
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(language === "ar" ? '🎉 مرحباً بك!' : "🎉 Welcome!", {
        body: language === "ar" ? "ابدأ يومك بإنجاز المهام 👌" : "Start your day by completing tasks 👌",
        icon: '/icons/icon-192.png',
      });

      overdueTasks.forEach((task) => {
        new Notification(language === "ar" ? '⚠️ مهمة متأخرة' : "⚠️ Overdue task", {
          body: language === "ar"
            ? `${task.title} كان موعدها ${task.dueDate!.toLocaleDateString('ar-EG')}`
            : `${task.title} was due on ${task.dueDate!.toLocaleDateString('en-US')}`,
          icon: '/icons/icon-192.png',
        });
      });

      upcomingTasks.forEach((task) => {
        const due = task.dueDate!;
        const diff = due.getTime() - new Date().getTime();
        if (diff <= 24 * 60 * 60 * 1000) {
          new Notification(language === "ar" ? '⏰ تذكير بمهمة' : "⏰ Task reminder", {
            body: language === "ar"
              ? `${task.title} غداً (${due.toLocaleDateString('ar-EG')})`
              : `${task.title} tomorrow (${due.toLocaleDateString('en-US')})`,
            icon: '/icons/icon-192.png',
          });
        }
      });
    }
  }, [overdueTasks, upcomingTasks, language]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
        <Bell className="w-7 h-7 text-theme" /> {t("لوحة التحكم", "Dashboard")}
      </h2>

      {/* 🔹 Cards Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: t("منجزة", "Done"),
            value: doneTasks.length,
            total: tasks.length,
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/30',
          },
          {
            title: t("قيد التنفيذ", "In progress"),
            value: inProgressTasks.length,
            icon: Clock,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/30',
          },
          {
            title: t("متبقية", "Remaining"),
            value: todoTasks.length,
            icon: Calendar,
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/30',
          },
          {
            title: t("متأخرة", "Overdue"),
            value: overdueTasks.length,
            icon: AlertTriangle,
            color: 'text-red-600',
            bg: 'bg-red-50 dark:bg-red-900/30',
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`${stat.bg} border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex justify-between items-center shadow-sm`}
            >
              <div>
                <p className="text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="font-bold">
                  {stat.value}
                  {stat.total && stat.title === t("منجزة", "Done") && (
                    <span className="text-gray-400 dark:text-gray-500">/{stat.total}</span>
                  )}
                </p>
              </div>
              <Icon className={`w-10 h-10 ${stat.color}`} />
            </div>
          );
        })}
      </div>

      {/* 🔹 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* معدل الإنجاز */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">{t("معدل الإنجاز", "Completion rate")}</h3>
            <Award className="text-yellow-500" />
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-theme h-3 rounded-full"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {completionRate}% {t("مكتملة", "Completed")}
          </p>
        </div>

        {/* PieChart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-4">{t("توزيع المهام", "Tasks distribution")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🔹 Weekly Productivity + Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* BarChart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-4">{t("إنتاجية الأسبوع", "Weekly productivity")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" stroke="#888" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--theme-color)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-4">{t("المهام القادمة", "Upcoming tasks")}</h3>
          {upcomingTasks.length > 0 ? (
            <ul className="space-y-2">
              {upcomingTasks.map((t) => (
                <li key={t.id} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span>{t.title}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {t.dueDate!.toLocaleDateString(language === "ar" ? 'ar-EG' : 'en-US')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              {t("لا توجد مهام قادمة 🎉", "No upcoming tasks 🎉")}
            </p>
          )}
        </div>
      </div>

      {/* 🔹 Streaks + Achievements + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Streak */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-2">{t("سلسلة الإنجاز", "Streak")}</h3>
          <p className="font-bold text-red-600">
            {streak} {t("يوم متتالي", "days in a row")}
          </p>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-2">{t("إنجازاتك", "Your achievements")}</h3>
          {achievements.length > 0 ? (
            <ul className="space-y-2">
              {achievements.map((a, i) => {
                const Icon = a.icon;
                return (
                  <li key={i} className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${a.color}`} />
                    <span>{a.title}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              {t("ابدأ بإنجاز مهامك لتحقق إنجازات 🏆", "Start completing tasks to unlock achievements 🏆")}
            </p>
          )}
        </div>

        {/* AI Insights */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-2">{t("اقتراحات ذكية 🤖", "Smart suggestions 🤖")}</h3>
          {aiInsights.length > 0 ? (
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              {aiInsights.map((insight, i) => (
                <li key={i}>• {insight}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">
              {t("جاري تحليل مهامك...", "Analyzing your tasks...")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
