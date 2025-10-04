// src/components/Goals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, CheckCircle, Bell, X, Calendar } from "lucide-react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

/** مبسط نوع الهدف */
type GoalItem = {
  id: string;
  title: string;
  purpose?: string;
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD"
  notifyTime?: string; // "HH:MM"
  notificationsEnabled?: boolean; // تفعيل التذكير (معلومات واجهة/حالة)
  completedDays?: string[]; // ["2025-09-28", ...]
  milestones?: { id: string; title: string; completed?: boolean }[];
  updatedAt?: number;
  [k: string]: any;
};

type Props = {
  goals?: GoalItem[];
  onGoalAdd?: (g: Omit<GoalItem, "id">) => void;
  onGoalUpdate?: (g: GoalItem) => void;
  onGoalDelete?: (id: string) => void;
  language?: "ar" | "en";
};

const FALLBACK_KEY = "achievo_goals_v1";

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
    setTimeFirst: "حدد وقت التذكير أولاً",
    reminderSet: "تم ضبط التذكير",
    reminderCancelled: "تم إلغاء التذكير",
    notifyDenied: "رفض أذونات الإشعارات",
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
    setTimeFirst: "Set reminder time first",
    reminderSet: "Reminder set",
    reminderCancelled: "Reminder cancelled",
    notifyDenied: "Notification permission denied",
    notifyNotSupported: "Notifications not supported",
  },
} as const;

export default function Goals(props: Props) {
  const { goals: parentGoals, onGoalAdd, onGoalUpdate, onGoalDelete, language = "ar" } = props;
  const t = (k: keyof typeof tr["ar"]) => tr[language][k];

  // toast صغير للfeedback بجانب زر
  const [toast, setToast] = useState<{ goalId: string; text: string; kind?: "info" | "success" | "warn"; target?: "check" | "bell" | "global" } | null>(null);
  const showGoalToast = (goalId: string, text: string, kind: "info" | "success" | "warn" = "info", target: "check" | "bell" | "global" = "global") => {
    setToast({ goalId, text, kind, target });
    setTimeout(() => {
      setToast((cur) => (cur && cur.goalId === goalId && cur.text === text && cur.target === target ? null : cur));
    }, 2200);
  };

  // fallback storage (localStorage)
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

  // helpers dates
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

  // form defaults (لا توجد checkbox للتذكير هنا — التفعيل عبر زر الجرس)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.duration, form.startDate]);

  // ---------- Notifications helpers ----------
  // stable numeric id from string id
  const toNotifId = (goalId: string) => {
    let n = 0;
    for (let i = 0; i < goalId.length; i++) {
      n = (n * 31 + goalId.charCodeAt(i)) % 1000000;
    }
    return n + 1000;
  };

  // schedule a daily notification for goal (will request permission if needed)
  async function scheduleGoalNotification(goal: GoalItem) {
    if (!goal.notifyTime) return;
    try {
      // request permission programmatically (no UI button)
      const perm = await LocalNotifications.requestPermissions();
      if ((perm as any).display !== "granted") {
        showGoalToast(goal.id, t("notifyDenied"), "warn", "bell");
        return;
      }

      const [hh, mm] = (goal.notifyTime || "09:00").split(":").map((v) => Number(v));
      const now = new Date();
      const at = new Date();
      at.setHours(hh, mm, 0, 0);
      if (at <= now) at.setDate(at.getDate() + 1);

      // cancel previous with same id then schedule
      const id = toNotifId(goal.id);
      await LocalNotifications.cancel({ notifications: [{ id }] });

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: goal.title || (language === "ar" ? "تذكير" : "Reminder"),
            body: goal.purpose || "",
            schedule: { at, repeats: true },
            sound: "default",
          },
        ],
      });

      showGoalToast(goal.id, t("reminderSet"), "success", "bell");
    } catch (err) {
      console.error("scheduleGoalNotification error:", err);
      showGoalToast(goal.id, t("notifyNotSupported"), "warn", "bell");
    }
  }

  async function cancelGoalNotification(goal: GoalItem) {
    try {
      const id = toNotifId(goal.id);
      await LocalNotifications.cancel({ notifications: [{ id }] });
      showGoalToast(goal.id, t("reminderCancelled"), "info", "bell");
    } catch (err) {
      console.error("cancelGoalNotification error:", err);
    }
  }

  // toggle reminder via Bell button — إذا كان هناك notifyTime نفعّل/نوقف؛ وإلا نطلب إدخال وقت
  const toggleReminder = async (g: GoalItem) => {
    const current = (parentGoals ? parentGoals.find((x) => x.id === g.id) : fallbackGoals.find((x) => x.id === g.id)) || g;

    if (!current.notifyTime) {
      showGoalToast(g.id, t("setTimeFirst"), "warn", "bell");
      return;
    }

    const enabled = !!current.notificationsEnabled;
    const updated: GoalItem = { ...current, notificationsEnabled: !enabled, updatedAt: Date.now() };

    // persist update
    if (onGoalUpdate) {
      onGoalUpdate(updated);
    } else {
      setFallbackGoals((s) => s.map((x) => (x.id === updated.id ? updated : x)));
    }

    // schedule or cancel
    if (!enabled) {
      // turning ON
      await scheduleGoalNotification(updated);
    } else {
      // turning OFF
      await cancelGoalNotification(updated);
    }
  };

  // ---------- CRUD helpers ----------
  const addGoal = (payload: Omit<GoalItem, "id">) => {
    if (onGoalAdd) {
      onGoalAdd(payload);
      return;
    }
    const g: GoalItem = { id: Date.now().toString(), ...payload, notificationsEnabled: false, updatedAt: Date.now() };
    setFallbackGoals((s) => [g, ...s]);
    // لا نفعّل التذكير مباشرة عند الحفظ — التفعيل عبر زر الجرس حسب رغبة المستخدم
  };

  const updateGoal = (g: GoalItem) => {
    if (onGoalUpdate) {
      onGoalUpdate(g);
      return;
    }
    setFallbackGoals((s) => s.map((x) => (x.id === g.id ? { ...g, updatedAt: Date.now() } : x)));
    // إذا التذكير مفعل مع notifyTime، أعد جدولة
    if (g.notificationsEnabled && g.notifyTime) {
      void scheduleGoalNotification(g);
    }
    if (!g.notificationsEnabled) {
      void cancelGoalNotification(g);
    }
  };

  const removeGoal = (id: string) => {
    if (onGoalDelete) {
      onGoalDelete(id);
      return;
    }
    setFallbackGoals((s) => s.filter((gg) => gg.id !== id));
    void LocalNotifications.cancel({ notifications: [{ id: toNotifId(id) }] }).catch(() => {});
  };

  // validation + form save
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
      notificationsEnabled: false, // لا نفعل تلقائياً
      completedDays: editingId ? (goals.find((x) => x.id === editingId)?.completedDays || []) : [],
      milestones: [],
      updatedAt: Date.now(),
    };

    if (editingId) {
      if (onGoalUpdate) onGoalUpdate({ id: editingId, ...base });
      else updateGoal({ id: editingId, ...base });
    } else {
      if (onGoalAdd) onGoalAdd(base);
      else addGoal(base);
    }

    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setErrors({});
  };

  // mark today functionality
  const markToday = (g: GoalItem) => {
    const today = isoToday();
    const days = g.completedDays || [];
    if (days.includes(today)) {
      showGoalToast(g.id, t("alreadyMarked"), "warn", "check");
      return;
    }
    const updated: GoalItem = { ...g, completedDays: [...days, today], updatedAt: Date.now() };
    if (onGoalUpdate) onGoalUpdate(updated);
    else updateGoal(updated);
    showGoalToast(g.id, language === "ar" ? "✓" : "Done", "success", "check");
  };

  // test helper (used only internally for native scheduling verification — NOT exposed as button)
  // On mount: if native and permission granted, re-schedule existing enabled goals
  useEffect(() => {
    (async () => {
      try {
        if (Capacitor.getPlatform() !== "web") {
          const perm = await LocalNotifications.requestPermissions();
          if ((perm as any).display === "granted") {
            for (const g of goals) {
              if (g.notifyTime && g.notificationsEnabled) {
                // seq to avoid plugin overload
                // eslint-disable-next-line no-await-in-loop
                await scheduleGoalNotification(g);
              }
            }
          }
        }
      } catch (err) {
        // ignore
        console.error("mount schedule error:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useMemo(() => (goals || []).slice().map((g) => ({ ...g, __progress: calcProgress(g) })), [goals]);

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">{t("header")}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{language === "ar" ? "تابع أهدافك — علّم مرة واحدة في اليوم" : "Track goals — mark once per day"}</p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setForm({ ...emptyForm }); setEditingId(null); setShowForm(true); }} className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded shadow">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("addGoal")}</span>
          </button>
        </div>
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${completed ? "bg-green-100 text-green-700" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}>
                        {completed ? (language === "ar" ? "منجز" : "Achieved") : `${progress}%`}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-3">{g.purpose}</p>

                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                      <Calendar className="w-4 h-4" />
                      <span>{g.startDate} → {g.endDate} {totalDays ? `(${totalDays} ${language === "ar" ? "يوم" : "days"})` : ""}</span>
                      {g.notifyTime && (
                        <span className="flex items-center gap-1 ml-2">
                          <Bell className="w-4 h-4" /> <span className="text-xs">{g.notifyTime}{g.notificationsEnabled ? " • ON" : ""}</span>
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
                    <div className="relative">
                      <button type="button" onClick={() => markToday(g)} title={t("markToday")} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      {toast && toast.goalId === g.id && toast.target === "check" && (
                        <div className={`absolute sm:left-full left-1/2 sm:ml-2 -translate-x-1/2 sm:translate-x-0 -top-8 sm:top-1/2 sm:-translate-y-1/2 px-2 py-1 rounded-md text-[11px] shadow-sm whitespace-nowrap z-10 ${toast.kind === "success" ? "bg-green-600 text-white" : toast.kind === "warn" ? "bg-yellow-400 text-black" : "bg-blue-600 text-white"}`} role="status" aria-live="polite">{toast.text}</div>
                      )}
                    </div>

                    <button type="button" onClick={() => { setShowForm(true); setEditingId(g.id); setForm({ title: g.title || "", purpose: g.purpose || "", startDate: g.startDate || isoToday(), endDate: g.endDate || isoToday(), duration: String(g.startDate && g.endDate ? daysBetweenInclusive(g.startDate, g.endDate) : defaultDuration), notifyTime: g.notifyTime || "" }); }} title={language === "ar" ? "تعديل" : "Edit"} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button type="button" onClick={() => setPendingDeleteId(g.id)} title={t("delete")} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="relative">
                      <button type="button" onClick={() => toggleReminder(g)} title={language === "ar" ? (g.notificationsEnabled ? "إيقاف التذكير" : "تشغيل التذكير") : (g.notificationsEnabled ? "Disable reminder" : "Enable reminder")} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-yellow-600">
                        <Bell className="w-5 h-5" />
                      </button>

                      {toast && toast.goalId === g.id && toast.target === "bell" && (
                        <div className={`absolute sm:left-full left-1/2 sm:ml-2 -translate-x-1/2 sm:translate-x-0 -top-8 sm:top-1/2 sm:-translate-y-1/2 px-2 py-1 rounded-md text-[11px] shadow-sm whitespace-nowrap z-10 ${toast.kind === "success" ? "bg-green-600 text-white" : toast.kind === "warn" ? "bg-yellow-400 text-black" : "bg-blue-600 text-white"}`} role="status" aria-live="polite">{toast.text}</div>
                      )}
                    </div>
                  </div>
                </header>
              </article>
            );
          })}
        </div>
      )}

      {/* form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-5 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{editingId ? t("editGoal") : t("addGoal")}</h3>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); setErrors({}); }} className="p-1" aria-label={t("cancel")}>
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
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); setErrors({}); }} className="flex-1 py-2 rounded border">
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* delete confirm */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded p-4 w-full max-w-sm">
            <p className="mb-4 text-gray-700 dark:text-gray-200">{t("deleteConfirm")}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { removeGoal(pendingDeleteId); setPendingDeleteId(null); }} className="flex-1 py-2 rounded bg-red-600 text-white">{t("delete")}</button>
              <button type="button" onClick={() => setPendingDeleteId(null)} className="flex-1 py-2 rounded border">{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
