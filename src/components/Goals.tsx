// src/components/Goals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, CheckCircle, Bell, X, Calendar } from "lucide-react";
import { LocalNotifications } from '@capacitor/local-notifications';

type GoalItem = {
  id: string;
  title: string;
  purpose?: string;
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD"
  notifyTime?: string; // "HH:MM"
  completedDays?: string[];
  milestones?: { id: string; title: string; completed?: boolean }[];
  updatedAt?: number;
  [k: string]: any;
};

type Props = {
  goals?: GoalItem[];
  tasks?: any[];
  onGoalAdd?: (g: Omit<GoalItem, "id">) => void;
  onGoalUpdate?: (g: GoalItem) => void;
  onGoalDelete?: (id: string) => void;
  language?: "ar" | "en";
};

const FALLBACK_KEY = "achiveo_goals_v1";

const tr = {
  ar: {
    header: "الأهداف",
    addGoal: "إضافة هدف",
    editGoal: "تعديل الهدف",
    title: "اسم الهدف *",
    purpose: "الغرض من الهدف *",
    start: "تاريخ البداية *",
    end: "تاريخ النهاية *",
    duration: "المدة (أيام)",
    notify: "وقت التنبيه (اختياري)",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    markToday: "وضع علامة اليوم",
    alreadyMarked: "لقد سجّلت إنجاز اليوم بالفعل",
    noGoals: "لا توجد أهداف بعد",
    testNotify: "جرّب التنبيه",
    deleteConfirm: "هل تريد حذف هذا الهدف؟",
    invalidDates: "تأكد أن تاريخ النهاية بعد تاريخ البداية",
    required: "هذا الحقل مطلوب",
    added: "تم إضافة الهدف",
    updated: "تم تحديث الهدف",
    deleted: "تم حذف الهدف",
    notifyDenied: "تم رفض أذونات الإشعارات",
    notifyNotSupported: "الإشعارات غير مدعومة",
  },
  en: {
    header: "Goals",
    addGoal: "Add Goal",
    editGoal: "Edit Goal",
    title: "Title *",
    purpose: "Purpose *",
    start: "Start date *",
    end: "End date *",
    duration: "Duration (days)",
    notify: "Notify time (optional)",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    markToday: "Mark today",
    alreadyMarked: "Already marked today — try tomorrow",
    noGoals: "No goals yet",
    testNotify: "Test notification",
    deleteConfirm: "Delete this goal?",
    invalidDates: "Make sure end date is after start date",
    required: "This field is required",
    added: "Goal added",
    updated: "Goal updated",
    deleted: "Goal deleted",
    notifyDenied: "Notification permission denied",
    notifyNotSupported: "Notifications not supported",
  },
} as const;

export default function Goals(props: Props) {
  const { goals: parentGoals, onGoalAdd, onGoalUpdate, onGoalDelete, language = "ar" } = props;

  const t = (k: keyof typeof tr["ar"]) => tr[language][k];

  // 🟢 طلب إذن الإشعارات
  async function requestPermission() {
    const granted = await LocalNotifications.requestPermissions();
    if (granted.display === 'granted') {
      console.log("✅ تم منح إذن الإشعارات");
    } else {
      console.log("❌ تم رفض إذن الإشعارات");
    }
  }

  // 🟢 إشعار تجريبي
  async function sendTestNotification() {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "🚀 استعد للإنجاز",
          body: "اليوم فرصة جديدة لتحقيق أهدافك 💪",
          id: 1,
          schedule: { at: new Date(Date.now() + 1000 * 5) }, // بعد 5 ثواني
          sound: "default",
        },
      ],
    });
  }

  // 🟢 إشعار تحفيزي يومي (9 صباحًا)
  async function scheduleDailyMotivation() {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "🔥 اشحن طاقتك",
          body: "اليوم فرصة جديدة للإنجاز 🚀",
          id: 9999,
          schedule: {
            repeats: true,
            every: 'day',
            on: { hour: 9, minute: 0 },
          },
          sound: "default",
        },
      ],
    });
  }

  useEffect(() => {
    requestPermission();
    scheduleDailyMotivation();
  }, []);

  // Toast
  const [toast, setToast] = useState<any>(null);

  // fallback local storage
  const [fallbackGoals, setFallbackGoals] = useState<GoalItem[]>(() => {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      return raw ? (JSON.parse(raw) as GoalItem[]) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(fallbackGoals));
    } catch {}
  }, [fallbackGoals]);

  const goals = parentGoals && parentGoals.length > 0 ? parentGoals : fallbackGoals;

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // helpers
  const isoToday = () => new Date().toISOString().split("T")[0];
  const addDaysToIso = (iso: string, days: number) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };
  const daysBetweenInclusive = (s: string, e: string) => {
    const start = new Date(s);
    const end = new Date(e);
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  };
  const calcProgress = (g: GoalItem) => {
    if (!g.startDate || !g.endDate) return 0;
    const total = daysBetweenInclusive(g.startDate, g.endDate);
    const done = (g.completedDays || []).length;
    return Math.min(100, Math.round((done / total) * 100));
  };

  const defaultDuration = 30;
  const emptyForm = {
    title: "",
    purpose: "",
    startDate: isoToday(),
    endDate: addDaysToIso(isoToday(), defaultDuration - 1),
    duration: String(defaultDuration),
    notifyTime: "",
  };
  const [form, setForm] = useState(() => ({ ...emptyForm }));

  useEffect(() => {
    const dur = parseInt(form.duration || "0", 10);
    if (!Number.isNaN(dur) && dur > 0) {
      const newEnd = addDaysToIso(form.startDate || isoToday(), dur - 1);
      setForm((f) => ({ ...f, endDate: newEnd }));
    }
  }, [form.duration, form.startDate]);

  // CRUD
  const addGoal = (payload: Omit<GoalItem, "id">) => {
    const g: GoalItem = { id: Date.now().toString(), ...payload, updatedAt: Date.now() };
    setFallbackGoals((s) => [g, ...s]);
  };

  const updateGoal = (g: GoalItem) => {
    setFallbackGoals((s) => s.map((x) => (x.id === g.id ? { ...g, updatedAt: Date.now() } : x)));
  };

  const removeGoal = (id: string) => {
    setFallbackGoals((s) => s.filter((gg) => gg.id !== id));
  };

  const validateForm = () => {
    const e: { [k: string]: string } = {};
    if (!form.title.trim()) e.title = t("required");
    if (!form.purpose.trim()) e.purpose = t("required");
    if (!form.startDate) e.startDate = t("required");
    if (!form.endDate) e.endDate = t("required");
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      e.endDate = t("invalidDates");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // 🟢 حفظ الهدف + جدولة الإشعار
  const handleSave = async () => {
    if (!validateForm()) return;

    const base: Omit<GoalItem, "id"> = {
      title: form.title.trim(),
      purpose: form.purpose.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      notifyTime: form.notifyTime || undefined,
      completedDays: editingId ? (goals.find((x) => x.id === editingId)?.completedDays || []) : [],
      milestones: [],
      updatedAt: Date.now(),
    };

    let savedGoal: GoalItem;
    if (editingId) {
      savedGoal = { id: editingId, ...base };
      updateGoal(savedGoal);
    } else {
      savedGoal = { id: Date.now().toString(), ...base };
      addGoal(base);
    }

    if (savedGoal.notifyTime) {
      const [hour, minute] = savedGoal.notifyTime.split(":").map(Number);
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "⏰ تذكير بالهدف",
            body: `لا تنسَ هدفك: ${savedGoal.title}`,
            id: Number(savedGoal.id),
            schedule: {
              repeats: true,
              every: 'day',
              on: { hour, minute },
            },
            sound: "default",
          },
        ],
      });
    }

    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setErrors({});
  };

  // mark today
  const markToday = (g: GoalItem) => {
    const today = isoToday();
    const days = g.completedDays || [];
    if (days.includes(today)) {
      return;
    }
    const updated: GoalItem = { ...g, completedDays: [...days, today], updatedAt: Date.now() };
    updateGoal(updated);
  };

  const list = useMemo(() => (goals || []).slice().map((g) => ({ ...g, __progress: calcProgress(g) })), [goals]);

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex gap-2 mb-4">
        <button onClick={requestPermission} className="bg-blue-600 text-white px-3 py-2 rounded">
          طلب إذن الإشعارات
        </button>
        <button onClick={sendTestNotification} className="bg-green-600 text-white px-3 py-2 rounded">
          إرسال إشعار تجريبي
        </button>
      </div>

      {list.length === 0 ? (
        <div className="p-6 text-center rounded border bg-gray-50 dark:bg-gray-800 text-gray-500">{t("noGoals")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((g: any) => {
            const progress = g.__progress as number;
            const completed = progress >= 100;
            const totalDays = g.startDate && g.endDate ? daysBetweenInclusive(g.startDate, g.endDate) : 0;

            return (
              <article key={g.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm flex flex-col">
                <header className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{g.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          completed ? "bg-green-100 text-green-700" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {completed ? (language === "ar" ? "منجز" : "Achieved") : `${progress}%`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-3">{g.purpose}</p>
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {g.startDate} → {g.endDate} {totalDays ? `(${totalDays} ${language === "ar" ? "يوم" : "days"})` : ""}
                      </span>
                      {g.notifyTime && (
                        <span className="flex items-center gap-1 ml-2">
                          <Bell className="w-4 h-4" /> <span>{g.notifyTime}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                        <div style={{ width: `${progress}%` }} className={`h-2 ${progress >= 100 ? "bg-green-400" : "bg-blue-500"}`} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{progress}%</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button type="button" onClick={() => markToday(g)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={() => openEdit(g)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setPendingDeleteId(g.id)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </header>
              </article>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-5 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{editingId ? t("editGoal") : t("addGoal")}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); setErrors({}); }} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">{t("title")}</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full p-2 border rounded bg-white dark:bg-gray-800" />
                {errors.title && <div className="text-xs text-red-500 mt-1">{errors.title}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium">{t("purpose")}</label>
                <textarea value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} className="w-full p-2 border rounded bg-white dark:bg-gray-800" />
                {errors.purpose && <div className="text-xs text-red-500 mt-1">{errors.purpose}</div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm">{t("start")}</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full p-2 border rounded bg-white dark:bg-gray-800" />
                  {errors.startDate && <div className="text-xs text-red-500 mt-1">{errors.startDate}</div>}
                </div>
                <div>
                  <label className="block text-sm">{t("end")}</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value, duration: String(daysBetweenInclusive(f.startDate, e.target.value)) }))} className="w-full p-2 border rounded bg-white dark:bg-gray-800" />
                  {errors.endDate && <div className="text-xs text-red-500 mt-1">{errors.endDate}</div>}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="block text-sm">{t("duration")}</label>
                  <input type="number" min={1} value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className="w-full p-2 border rounded bg-white dark:bg-gray-800" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm">{t("notify")}</label>
                  <input type="time" value={form.notifyTime} onChange={(e) => setForm((f) => ({ ...f, notifyTime: e.target.value }))} className="w-full p-2 border rounded bg-white dark:bg-gray-800" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded">
                {t("save")}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); setErrors({}); }} className="flex-1 py-2 rounded border">
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded p-4 w-full max-w-sm">
            <p className="mb-4 text-gray-700 dark:text-gray-200">{t("deleteConfirm")}</p>
            <div className="flex gap-2">
              <button onClick={() => { removeGoal(pendingDeleteId); setPendingDeleteId(null); }} className="flex-1 py-2 rounded bg-red-600 text-white">
                {t("delete")}
              </button>
              <button onClick={() => setPendingDeleteId(null)} className="flex-1 py-2 rounded border">
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
