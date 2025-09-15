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
}

// 🔹 Hook للذكاء الاصطناعي (محدثة)
const useAIInsights = (tasks: Task[]) => {
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
          suggestions.push(`⚠️ لديك ${overdue.length} مهمة متأخرة! حاول إنجازها أولًا.`);

        const upcoming = tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate >= new Date());
        if (upcoming.length > 0)
          suggestions.push(`⏰ استعد لمهامك القادمة: ${upcoming[0].title}`);

        const done = tasks.filter(t => t.status === 'done');
        if (done.length > 0)
          suggestions.push(`✅ لقد أنجزت ${done.length} مهمة! أحسنت 👍`);

        setInsights(suggestions);
      }
    };

    if (tasks.length > 0) fetchInsights();
  }, [tasks]);

  return insights;
};

export const Dashboard: React.FC<DashboardProps> = ({ tasks, goals }) => {
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
    { name: 'منجزة', value: doneTasks.length, color: '#22c55e' },
    { name: 'قيد التنفيذ', value: inProgressTasks.length, color: '#3b82f6' },
    { name: 'متبقية', value: todoTasks.length, color: '#a1a1aa' },
  ];

  // 🔹 إنتاجية الأسبوع BarChart
  const weekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const weeklyData = weekDays.map((day, i) => {
    const dayTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate.getDay() === i && t.status === 'done'
    );
    return { day, value: dayTasks.length };
  });

  // 🔹 Upcoming Tasks (أقرب 5 مهام)
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
      title: 'أنجزت 10 مهام!',
      icon: Trophy,
      color: 'text-yellow-600',
    });
  if (streak >= 3)
    achievements.push({
      title: `🔥 سلسلة ${streak} أيام!`,
      icon: Flame,
      color: 'text-red-600',
    });

  // 🔹 AI Insights
  const aiInsights = useAIInsights(tasks);

  // ✅ إشعارات ذكية
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎉 مرحباً بك!', {
        body: 'ابدأ يومك بإنجاز المهام 👌',
        icon: '/icons/icon-192.png',
      });

      overdueTasks.forEach((task) => {
        new Notification('⚠️ مهمة متأخرة', {
          body: `${task.title} كان موعدها ${task.dueDate!.toLocaleDateString('ar-EG')}`,
          icon: '/icons/icon-192.png',
        });
      });

      upcomingTasks.forEach((task) => {
        const due = task.dueDate!;
        const diff = due.getTime() - new Date().getTime();
        if (diff <= 24 * 60 * 60 * 1000) {
          new Notification('⏰ تذكير بمهمة', {
            body: `${task.title} غداً (${due.toLocaleDateString('ar-EG')})`,
            icon: '/icons/icon-192.png',
          });
        }
      });
    }
  }, [overdueTasks, upcomingTasks]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
        <Bell className="w-7 h-7 text-theme" /> لوحة التحكم
      </h2>

      {/* 🔹 Cards Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: 'منجزة',
            value: doneTasks.length,
            total: tasks.length,
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/30',
          },
          {
            title: 'قيد التنفيذ',
            value: inProgressTasks.length,
            icon: Clock,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/30',
          },
          {
            title: 'متبقية',
            value: todoTasks.length,
            icon: Calendar,
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/30',
          },
          {
            title: 'متأخرة',
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
                  {stat.total && stat.title === 'منجزة' && (
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
            <h3 className="font-semibold">معدل الإنجاز</h3>
            <Award className="text-yellow-500" />
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-theme h-3 rounded-full"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{completionRate}% مكتملة</p>
        </div>

        {/* PieChart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-4">توزيع المهام</h3>
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
          <h3 className="font-semibold mb-4">إنتاجية الأسبوع</h3>
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
          <h3 className="font-semibold mb-4">المهام القادمة</h3>
          {upcomingTasks.length > 0 ? (
            <ul className="space-y-2">
              {upcomingTasks.map((t) => (
                <li key={t.id} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span>{t.title}</span>
                  <span className="text-gray-500 dark:text-gray-400">{t.dueDate!.toLocaleDateString('ar-EG')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">لا توجد مهام قادمة 🎉</p>
          )}
        </div>
      </div>

      {/* 🔹 Streaks + Achievements + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Streak */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-2">سلسلة الإنجاز</h3>
          <p className="font-bold text-red-600">{streak} يوم متتالي</p>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-2">إنجازاتك</h3>
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
            <p className="text-gray-500 dark:text-gray-400">ابدأ بإنجاز مهامك لتحقق إنجازات 🏆</p>
          )}
        </div>

        {/* AI Insights */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-2">اقتراحات ذكية 🤖</h3>
          {aiInsights.length > 0 ? (
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              {aiInsights.map((insight, i) => (
                <li key={i}>• {insight}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">جاري تحليل مهامك...</p>
          )}
        </div>
      </div>
    </div>
  );
};
