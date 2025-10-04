// src/components/Goals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, CheckCircle, Bell, X, Calendar } from "lucide-react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

/** نوع الهدف */
type GoalItem = {
  id: string;
  title: string;
  purpose?: string;
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD"
  notifyTime?: string; // "HH:MM"
  notificationsEnabled?: boolean;
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
    notify: "وقت التذكير (اختياري)",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    markToday: "وضع علامة اليوم",
    alreadyMarked: "سجّلت اليوم بالفعل",
    noGoals: "لا توجد أهداف بعد",
    deleteConfirm: "هل تريد حذف هذا الهدف؟",
    invalidDates: "تأكد أن تاريخ النهاية بعد البداية",
    required: "هذا الحقل مطلوب",
    added: "تم إضافة الهدف",
    updated: "تم تحديث الهدف",
    deleted: "تم حذف الهدف",
    reminderOn: "تم ضبط التذكير",
    reminderOff: "تم إلغاء التذكير",
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
    notify: "Reminder time (optional)",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    markToday: "Mark today",
    alreadyMarked: "Already marked",
    noGoals: "No goals yet",
    deleteConfirm: "Delete this goal?",
    invalidDates: "Make sure end date is after start date",
    required: "This field is required",
    added: "Goal added",
    updated: "Goal updated",
    deleted: "Goal deleted",
    reminderOn: "Reminder set",
    reminderOff: "Reminder cancelled",
  },
} as const;

export default function Goals(props: Props) {
  const { goals: parentGoals, onGoalAdd, onGoalUpdate, onGoalDelete, language = "ar" } = props;
  const t = (k: keyof typeof tr["ar"]) => tr[language][k];

  // toast صغير
  const [toast, setToast] = useState<{
    goalId: string;
    text: string;
    kind?: "info" | "success" | "warn";
    target?: "check" | "bell" | "global";
  } | null>(null);

  const showGoalToast = (
    goalId: string,
    text: string,
    kind: "info" | "success" | "warn" = "info",
    target: "check" | "bell" | "global" = "global"
  ) => {
    setToast({ goalId, text, kind, target });
    setTimeout(() => {
      setToast((cur) => (cur && cur.goalId === goalId && cur.text === text && cur.target === target ? null : cur));
    }, 2000);
  };

  // تخزين محلي
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

  // حالات الواجهة
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // توابع مساعدة
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

  // form
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

  // ⏰ جدولة إشعارات
  const toNotifId = (goalId: string) => {
    let n = 0;
    for (let i = 0; i < goalId.length; i++) {
      n = (n * 31 + goalId.charCodeAt(i)) % 1000000;
    }
    return n + 1000;
  };

  async function scheduleGoalNotification(goal: GoalItem) {
    if (!goal.notifyTime) return;
    try {
      const perm = await LocalNotifications.requestPermissions();
      if ((perm as any).display !== "granted") return;

      const [hh, mm] = goal.notifyTime.split(":").map((v) => Number(v));
      const now = new Date();
      let at = new Date();
      at.setHours(hh, mm, 0, 0);
      if (at <= now) at.setDate(at.getDate() + 1);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: toNotifId(goal.id),
            title: goal.title || (language === "ar" ? "تذكير" : "Reminder"),
            body: goal.purpose || "",
            schedule: { at, repeats: true },
            sound: "default",
          },
        ],
      });
      showGoalToast(goal.id, t("reminderOn"), "success", "bell");
    } catch (err) {
      console.error("schedule error", err);
    }
  }

  async function cancelGoalNotification(goal: GoalItem) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: toNotifId(goal.id) }] });
      showGoalToast(goal.id, t("reminderOff"), "info", "bell");
    } catch {}
  }

  // CRUD
  const addGoal = (payload: Omit<GoalItem, "id">) => {
    if (onGoalAdd) {
      onGoalAdd(payload);
      return;
    }
    const g: GoalItem = { id: Date.now().toString(), ...payload, updatedAt: Date.now() };
    setFallbackGoals((s) => [g, ...s]);
    if (g.notifyTime) scheduleGoalNotification(g);
  };

  const updateGoal = (g: GoalItem) => {
    if (onGoalUpdate) {
      onGoalUpdate(g);
      return;
    }
    setFallbackGoals((s) => s.map((x) => (x.id === g.id ? { ...g, updatedAt: Date.now() } : x)));
    if (g.notifyTime) scheduleGoalNotification(g);
  };

  const removeGoal = (id: string) => {
    if (onGoalDelete) {
      onGoalDelete(id);
      return;
    }
    setFallbackGoals((s) => s.filter((gg) => gg.id !== id));
    cancelGoalNotification({ id } as GoalItem);
  };

  const validateForm = () => {
    const e: { [k: string]: string } = {};
    if (!form.title.trim()) e.title = t("required");
    if (!form.purpose.trim()) e.purpose = t("required");
    if (!form.startDate) e.startDate = t("required");
    if (!form.endDate) e.endDate = t("required");
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) e.endDate = t("invalidDates");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
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

    if (editingId) updateGoal({ id: editingId, ...base });
    else addGoal(base);

    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setErrors({});
  };

  // علامة اليوم
  const markToday = (g: GoalItem) => {
    const today = isoToday();
    const days = g.completedDays || [];
    if (days.includes(today)) {
      showGoalToast(g.id, t("alreadyMarked"), "warn", "check");
      return;
    }
    const updated: GoalItem = { ...g, completedDays: [...days, today], updatedAt: Date.now() };
    updateGoal(updated);
  };

  // تبديل التذكير عند الضغط على الجرس
  const toggleReminder = (g: GoalItem) => {
    if (g.notifyTime) {
      cancelGoalNotification(g);
      updateGoal({ ...g, notifyTime: undefined });
    } else {
      // لو معندوش وقت، مش هيتعمل حاجة
      showGoalToast(g.id, language === "ar" ? "حدد وقت أولاً" : "Set time first", "warn", "bell");
    }
  };

  const list = useMemo(() => goals.map((g) => ({ ...g, __progress: calcProgress(g) })), [goals]);

  // إعادة جدولة عند تشغيل التطبيق
  useEffect(() => {
    (async () => {
      if (Capacitor.getPlatform() !== "web") {
        const perm = await LocalNotifications.requestPermissions();
        if ((perm as any).display === "granted") {
          for (const g of goals) {
            if (g.notifyTime) await scheduleGoalNotification(g);
          }
        }
      }
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">{t("header")}</h2>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-1">
          <Plus className="w-4 h-4" /> {t("addGoal")}
        </button>
      </div>

      {list.length === 0 ? (
        <div className="p-6 text-center border rounded">{t("noGoals")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((g) => (
            <article key={g.id} className="p-4 border rounded shadow-sm flex flex-col">
              <header className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold">{g.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{g.purpose}</p>
                  <div className="text-xs mt-2 flex gap-2 items-center">
                    <Calendar className="w-4 h-4" />
                    {g.startDate} → {g.endDate}
                    {g.notifyTime && (
                      <span className="flex items-center gap-1">
                        <Bell className="w-4 h-4" /> {g.notifyTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-center">
                  <button onClick={() => markToday(g)} className="text-green-600">
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button onClick={() => setEditingId(g.id)} className="text-blue-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPendingDeleteId(g.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleReminder(g)} className="text-yellow-600">
                    <Bell className="w-5 h-5" />
                  </button>
                </div>
              </header>
              {toast && toast.goalId === g.id && toast.target === "bell" && (
                <div className="text-xs mt-2">{toast.text}</div>
              )}
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded w-full max-w-md">
            <div className="flex justify-between mb-3">
              <h3>{editingId ? t("editGoal") : t("addGoal")}</h3>
              <button onClick={() => setShowForm(false)}>
                <X />
              </button>
            </div>

            <div className="space-y-3">
              <input
                placeholder={t("title")}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border p-2 rounded"
              />
              <textarea
                placeholder={t("purpose")}
                value={form.purpose}
                onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                className="w-full border p-2 rounded"
              />
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              <input type="time" value={form.notifyTime} onChange={(e) => setForm((f) => ({ ...f, notifyTime: e.target.value }))} />
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-2 rounded">
                {t("save")}
              </button>
              <button onClick={() => setShowForm(false)} className="px-3 py-2 border rounded">
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded">
            <p>{t("deleteConfirm")}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  removeGoal(pendingDeleteId);
                  setPendingDeleteId(null);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                {t("delete")}
              </button>
              <button onClick={() => setPendingDeleteId(null)} className="px-3 py-1 border rounded">
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
