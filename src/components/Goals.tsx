// src/components/Goals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, CheckCircle, Bell, X, Calendar } from "lucide-react";
import { Goal } from "../types";

/**
 * Props المتوقعة من App.tsx
 */
type Props = {
  goals?: Goal[];
  tasks?: any[]; // إن لزم ربط المهام بالهدف
  onGoalAdd?: (g: Omit<Goal, "id">) => void;
  onGoalUpdate?: (g: Goal) => void;
  onGoalDelete?: (id: string) => void;
  language?: "ar" | "en";
};

const FALLBACK_KEY = "achiveo_goals_fallback_v1";

/** ترجمات بسيطة */
const tr = {
  ar: {
    header: "الأهداف",
    addGoal: "إضافة هدف",
    editGoal: "تعديل الهدف",
    title: "اسم الهدف *",
    purpose: "الغرض من الهدف *",
    start: "تاريخ البداية *",
    end: "تاريخ النهاية *",
    duration: "المدة (يوم)",
    notify: "وقت التنبيه (اختياري)",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    markToday: "وضع علامة اليوم",
    alreadyMarked: "تم تسجيل إنجاز اليوم لهذا الهدف بالفعل",
    noGoals: "لا توجد أهداف بعد",
    testNotify: "جرّب التنبيه الآن",
    deleteConfirm: "هل تريد حذف هذا الهدف؟",
    invalidDates: "تأكد أن تاريخ النهاية بعد تاريخ البداية",
    required: "هذا الحقل مطلوب",
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
    alreadyMarked: "Already marked today",
    noGoals: "No goals yet",
    testNotify: "Test notification",
    deleteConfirm: "Delete this goal?",
    invalidDates: "Make sure end date is after start date",
    required: "This field is required",
  },
} as const;

export default function Goals(props: Props) {
  const { goals: parentGoals, onGoalAdd, onGoalUpdate, onGoalDelete, language = "ar" } = props;
  const t = (k: keyof typeof tr["ar"]) => tr[language][k];

  // fallback local storage (if parent doesn't pass callbacks)
  const [fallbackGoals, setFallbackGoals] = useState<Goal[]>(() => {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      return raw ? (JSON.parse(raw) as Goal[]) : [];
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
  const todayIso = () => new Date().toISOString().split("T")[0];

  // form default: start = today, duration = 30 (user can change)
  const defaultDuration = 30;
  const emptyForm = {
    title: "",
    purpose: "",
    startDate: todayIso(),
    endDate: addDaysToIso(todayIso(), defaultDuration),
    duration: defaultDuration.toString(),
    notifyTime: "",
  };
  const [form, setForm] = useState(() => ({ ...emptyForm }));

  // validation errors
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // delete confirm
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // helpers
  function addDaysToIso(iso: string, days: number) {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }

  function daysBetweenInclusive(s: string, e: string) {
    const start = new Date(s);
    const end = new Date(e);
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }

  function calcProgress(g: Goal) {
    if (!g.startDate || !g.endDate) return 0;
    const total = daysBetweenInclusive(g.startDate, g.endDate);
    const done = (g.completedDays || []).length;
    // percent per day = 100 / total
    return Math.min(100, Math.round((done / total) * 100));
  }

  // unified mutators (call parent's callbacks if present)
  const addGoal = (payload: Omit<Goal, "id">) => {
    if (onGoalAdd) {
      onGoalAdd(payload);
      return;
    }
    const g: Goal = { id: Date.now().toString(), ...payload, updatedAt: Date.now() };
    setFallbackGoals((s) => [g, ...s]);
  };

  const updateGoal = (g: Goal) => {
    if (onGoalUpdate) {
      onGoalUpdate(g);
      return;
    }
    setFallbackGoals((s) => s.map((x) => (x.id === g.id ? { ...g, updatedAt: Date.now() } : x)));
  };

  const deleteGoal = (id: string) => {
    if (onGoalDelete) {
      onGoalDelete(id);
      return;
    }
    setFallbackGoals((s) => s.filter((g) => g.id !== id));
  };

  // open add modal
  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setErrors({});
    setShowForm(true);
  };

  // open edit modal
  const openEdit = (g: Goal) => {
    setForm({
      title: g.title || "",
      purpose: g.purpose || "",
      startDate: g.startDate || todayIso(),
      endDate: g.endDate || todayIso(),
      duration: String(g.startDate && g.endDate ? daysBetweenInclusive(g.startDate, g.endDate) : defaultDuration),
      notifyTime: g.notifyTime || "",
    });
    setEditingId(g.id);
    setErrors({});
    setShowForm(true);
  };

  // validation: returns boolean
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

  // save handler (does NOT close on invalid)
  const handleSave = () => {
    if (!validateForm()) return; // keep modal open and show errors

    const base: Omit<Goal, "id"> = {
      title: form.title.trim(),
      purpose: form.purpose.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      notifyTime: form.notifyTime || undefined,
      completedDays: editingId ? (goals.find((x) => x.id === editingId)?.completedDays || []) : [],
      milestones: [],
      updatedAt: Date.now(),
    };

    if (editingId) {
      updateGoal({ id: editingId, ...base });
    } else {
      addGoal(base);
    }

    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setErrors({});
  };

  // mark today (only once)
  const markToday = (g: Goal) => {
    const today = todayIso();
    const days = g.completedDays || [];
    if (days.includes(today)) {
      // friendly message without reload
      window.navigator.vibrate?.(50);
      return alert(tr[language].alreadyMarked);
    }
    const updated: Goal = { ...g, completedDays: [...days, today], updatedAt: Date.now() };
    updateGoal(updated);
  };

  // test notification
  const testNotifyNow = async (g: Goal) => {
    if (!("Notification" in window)) {
      return alert("Notifications not supported");
    }
    if (Notification.permission === "granted") {
      new Notification(g.title || "Reminder", { body: g.purpose || "" });
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      new Notification(g.title || "Reminder", { body: g.purpose || "" });
    } else {
      alert("Permission denied for notifications");
    }
  };

  // when user changes duration, update endDate accordingly
  useEffect(() => {
    const dur = parseInt(form.duration || "0", 10);
    if (!Number.isNaN(dur) && dur > 0) {
      const newEnd = addDaysToIso(form.startDate || todayIso(), dur - 1); // dur days inclusive
      setForm((f) => ({ ...f, endDate: newEnd }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.duration, form.startDate]);

  // computed list with progress
  const list = useMemo(() => {
    return (goals || []).slice().map((g) => ({ ...g, __progress: calcProgress(g) }));
  }, [goals]);

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">{t("header")}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">تابع أهدافك — ضع علامة واحدة فقط يومياً</p>
        </div>

        <div>
          <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded shadow">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t("addGoal")}</span>
          </button>
        </div>
      </div>

      {/* القائمة */}
      {list.length === 0 ? (
        <div className="p-6 text-center rounded border bg-gray-50 dark:bg-gray-800 text-gray-500">{t("noGoals")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((g) => {
            const progress = (g as any).__progress as number;
            const completed = progress >= 100;
            const totalDays = daysBetweenInclusive(g.startDate, g.endDate);
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

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{g.purpose}</p>

                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                      <Calendar className="w-4 h-4" />
                      <span>{g.startDate} → {g.endDate} ({totalDays} {language === "ar" ? "يوم" : "days"})</span>
                      {g.notifyTime && (
                        <span className="flex items-center gap-1 ml-2">
                          <Bell className="w-4 h-4" /> <span>{g.notifyTime}</span>
                        </span>
                      )}
                    </div>

                    {/* شريط التقدم */}
                    <div className="mt-3">
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                        <div style={{ width: `${progress}%` }} className={`h-2 ${progress >= 100 ? "bg-green-400" : "bg-blue-500"}`} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{progress}%</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <button type="button" onClick={() => openEdit(g)} title={language === "ar" ? "تعديل" : "Edit"} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button type="button" onClick={() => setPendingDeleteId(g.id)} title={language === "ar" ? "حذف" : "Delete"} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button type="button" onClick={() => markToday(g)} title={t("markToday")} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                    </button>

                    {g.notifyTime && (
                      <button type="button" onClick={() => testNotifyNow(g)} title={t("testNotify")} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-yellow-600">
                        <Bell className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </header>
              </article>
            );
          })}
        </div>
      )}

      {/* نافذة الإضافة / التعديل */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-5 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{editingId ? tr[language].editGoal : tr[language].addGoal}</h3>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); setErrors({}); }} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">{t("title")}</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-800"
                />
                {errors.title && <div role="alert" className="text-xs text-red-500 mt-1">{errors.title}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium">{t("purpose")}</label>
                <textarea
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-800"
                />
                {errors.purpose && <div role="alert" className="text-xs text-red-500 mt-1">{errors.purpose}</div>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm">{t("start")}</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800"
                  />
                  {errors.startDate && <div role="alert" className="text-xs text-red-500 mt-1">{errors.startDate}</div>}
                </div>
                <div>
                  <label className="block text-sm">{t("end")}</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value, duration: String(daysBetweenInclusive(f.startDate, e.target.value)) }))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800"
                  />
                  {errors.endDate && <div role="alert" className="text-xs text-red-500 mt-1">{errors.endDate}</div>}
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="block text-sm">{t("duration")}</label>
                  <input
                    type="number"
                    min={1}
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm">{t("notify")}</label>
                  <input
                    type="time"
                    value={form.notifyTime}
                    onChange={(e) => setForm((f) => ({ ...f, notifyTime: e.target.value }))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded">{t("save")}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); setErrors({}); }} className="flex-1 py-2 rounded border">{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {/* تأكيد الحذف */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded p-4 w-full max-w-sm">
            <p className="mb-4 text-gray-700 dark:text-gray-200">{t("deleteConfirm")}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { deleteGoal(pendingDeleteId); setPendingDeleteId(null); }} className="flex-1 py-2 rounded bg-red-600 text-white">{t("delete")}</button>
              <button type="button" onClick={() => setPendingDeleteId(null)} className="flex-1 py-2 rounded border">{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
