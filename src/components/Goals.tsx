// src/components/Goals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, CheckCircle, Bell, X, Calendar } from "lucide-react";
import { Goal } from "../types";

type Props = {
  goals?: Goal[];
  tasks?: any[];
  onGoalAdd?: (g: Omit<Goal, "id">) => void;
  onGoalUpdate?: (g: Goal) => void;
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
    alreadyMarked: "لقد سجّلت إنجاز اليوم بالفعل — جرّب غدًا",
    noGoals: "لا توجد أهداف بعد",
    testNotify: "جرّب التنبيه",
    deleteConfirm: "هل تريد حذف هذا الهدف؟",
    invalidDates: "تأكد أن تاريخ النهاية بعد تاريخ البداية",
    required: "هذا الحقل مطلوب",
    added: "تم إضافة الهدف",
    updated: "تم تحديث الهدف",
    deleted: "تم حذف الهدف",
    notifyDenied: "تم رفض أذونات الإشعارات",
    notifyNotSupported: "الإشعارات غير مدعومة في هذا المتصفح",
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

  // toast now tied to specific goalId and auto-cleared
  const [toast, setToast] = useState<{ goalId: string; text: string; kind?: "info" | "success" | "warn" } | null>(null);

  // helper to show a goal-specific toast and auto-clear it
  const showGoalToast = (goalId: string, text: string, kind: "info" | "success" | "warn" = "info") => {
    setToast({ goalId, text, kind });
    window.setTimeout(() => {
      // only clear if it's the same toast (avoid race)
      setToast((cur) => (cur && cur.goalId === goalId && cur.text === text ? null : cur));
    }, 2500);
  };

  // fallback storage for goals if parent doesn't provide callbacks
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

  // UI state for modal/form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // delete confirm
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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

  const calcProgress = (g: Goal) => {
    if (!g.startDate || !g.endDate) return 0;
    const total = daysBetweenInclusive(g.startDate, g.endDate);
    const done = (g.completedDays || []).length;
    return Math.min(100, Math.round((done / total) * 100));
  };

  // form state
  const defaultDuration = 30;
  const emptyForm = {
    title: "",
    purpose: "",
    startDate: isoToday(),
    endDate: addDaysToIso(isoToday(), defaultDuration - 1), // inclusive
    duration: String(defaultDuration),
    notifyTime: "",
  };
  const [form, setForm] = useState(() => ({ ...emptyForm }));
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // sync duration -> endDate automatically
  useEffect(() => {
    const dur = parseInt(form.duration || "0", 10);
    if (!Number.isNaN(dur) && dur > 0) {
      const newEnd = addDaysToIso(form.startDate || isoToday(), dur - 1);
      setForm((f) => ({ ...f, endDate: newEnd }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.duration, form.startDate]);

  // unified mutators (call parent callbacks if provided)
  const addGoal = (payload: Omit<Goal, "id">) => {
    if (onGoalAdd) {
      onGoalAdd(payload);
      // cannot reliably know id here — show generic toast (center)
      return;
    }
    const g: Goal = { id: Date.now().toString(), ...payload, updatedAt: Date.now() };
    setFallbackGoals((s) => [g, ...s]);
    showGoalToast(g.id, t("added"), "success");
  };

  const updateGoal = (g: Goal) => {
    if (onGoalUpdate) {
      onGoalUpdate(g);
      return;
    }
    setFallbackGoals((s) => s.map((x) => (x.id === g.id ? { ...g, updatedAt: Date.now() } : x)));
    showGoalToast(g.id, t("updated"), "success");
  };

  const removeGoal = (id: string) => {
    if (onGoalDelete) {
      onGoalDelete(id);
      return;
    }
    setFallbackGoals((s) => s.filter((g) => g.id !== id));
    // show toast near nothing (use center) — but we'll show near removed id briefly
    showGoalToast(id, t("deleted"), "info");
  };

  // validate form
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

  // open add
  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setErrors({});
    setShowForm(true);
  };

  // open edit
  const openEdit = (g: Goal) => {
    setForm({
      title: g.title || "",
      purpose: g.purpose || "",
      startDate: g.startDate || isoToday(),
      endDate: g.endDate || isoToday(),
      duration: String(g.startDate && g.endDate ? daysBetweenInclusive(g.startDate, g.endDate) : defaultDuration),
      notifyTime: g.notifyTime || "",
    });
    setEditingId(g.id);
    setErrors({});
    setShowForm(true);
  };

  const handleSave = () => {
    if (!validateForm()) return;
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

  // mark today once only (now uses showGoalToast to attach message to goal)
  const markToday = (g: Goal) => {
    const today = isoToday();
    const days = g.completedDays || [];
    if (days.includes(today)) {
      showGoalToast(g.id, t("alreadyMarked"), "warn");
      window.navigator.vibrate?.(30);
      return;
    }
    const updated: Goal = { ...g, completedDays: [...days, today], updatedAt: Date.now() };
    updateGoal(updated);
    showGoalToast(g.id, (language === "ar" ? "✓" : "Done") as string, "success");
  };

  // test notification
  const testNotifyNow = async (g: Goal) => {
    if (!("Notification" in window)) {
      showGoalToast(g.id, t("notifyNotSupported"), "warn");
      return;
    }
    if (Notification.permission === "granted") {
      new Notification(g.title || "Reminder", { body: g.purpose || "" });
      showGoalToast(g.id, t("testNotify"), "info");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      new Notification(g.title || "Reminder", { body: g.purpose || "" });
      showGoalToast(g.id, t("testNotify"), "info");
    } else {
      showGoalToast(g.id, t("notifyDenied"), "warn");
    }
  };

  // computed list with progress
  const list = useMemo(() => (goals || []).slice().map((g) => ({ ...g, __progress: calcProgress(g) })), [goals]);

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">{t("header")}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {language === "ar" ? "تابع أهدافك — علّم مرة واحدة في اليوم" : "Track goals — mark once per day"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded shadow">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t("addGoal")}</span>
          </button>
        </div>
      </div>

      {/* list */}
      {list.length === 0 ? (
        <div className="p-6 text-center rounded border bg-gray-50 dark:bg-gray-800 text-gray-500">{t("noGoals")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          
          
          
          {list.map((g) => {
            const progress = (g as any).__progress as number;
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

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{g.purpose}</p>

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









```tsx
{/* progress bar */}
<div className="mt-3">
  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
    <div
      style={{ width: `${progress}%` }}
      className={`h-2 ${progress >= 100 ? "bg-green-400" : "bg-blue-500"}`}
    />
  </div>
  <div className="text-xs text-gray-500 mt-1">{progress}%</div>
</div>
</div>

{/* buttons column; each button is relative so toast can appear beside it */}
<div className="flex flex-col items-center gap-2">
  <div className="relative">
    <button
      type="button"
      onClick={() => markToday(g)}
      title={t("markToday")}
      className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600"
    >
      <CheckCircle className="w-5 h-5" />
    </button>

    {/* inline toast for this goal (appears to the right of the button) */}
    {toast && toast.goalId === g.id && (
      <div
        className={`absolute left-full ml-1 top-1/2 -translate-y-1/2 
          px-2 py-0.5 rounded text-[10px] shadow whitespace-nowrap
          ${
            toast.kind === "success"
              ? "bg-green-600 text-white"
              : toast.kind === "warn"
              ? "bg-yellow-400 text-black"
              : "bg-blue-600 text-white"
          }`}
      >
        {toast.text}
      </div>
    )}
  </div>

  <div className="relative">
    <button
      type="button"
      onClick={() => openEdit(g)}
      title={language === "ar" ? "تعديل" : "Edit"}
      className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <Edit3 className="w-4 h-4" />
    </button>
  </div>

  <div className="relative">
    <button
      type="button"
      onClick={() => setPendingDeleteId(g.id)}
      title={t("delete")}
      className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>

  {g.notifyTime && (
    <div className="relative">
      <button
        type="button"
        onClick={() => testNotifyNow(g)}
        title={t("testNotify")}
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-yellow-600"
      >
        <Bell className="w-5 h-5" />
      </button>

      {/* show same inline toast if active for this goal (e.g. notification denied/not supported) */}
      {toast && toast.goalId === g.id && (
        <div
          className={`absolute left-full ml-1 top-1/2 -translate-y-1/2 
            px-2 py-0.5 rounded text-[10px] shadow whitespace-nowrap
            ${
              toast.kind === "success"
                ? "bg-green-600 text-white"
                : toast.kind === "warn"
                ? "bg-yellow-400 text-black"
                : "bg-blue-600 text-white"
            }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  )}
</div>
```









      {/* form modal (add / edit) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-5 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{editingId ? t("editGoal") : t("addGoal")}</h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm({ ...emptyForm });
                  setErrors({});
                }}
                className="p-1"
              >
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
                {errors.title && <div className="text-xs text-red-500 mt-1">{errors.title}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium">{t("purpose")}</label>
                <textarea
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-800"
                />
                {errors.purpose && <div className="text-xs text-red-500 mt-1">{errors.purpose}</div>}
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
                  {errors.startDate && <div className="text-xs text-red-500 mt-1">{errors.startDate}</div>}
                </div>
                <div>
                  <label className="block text-sm">{t("end")}</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endDate: e.target.value, duration: String(daysBetweenInclusive(f.startDate, e.target.value)) }))
                    }
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800"
                  />
                  {errors.endDate && <div className="text-xs text-red-500 mt-1">{errors.endDate}</div>}
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
              <button type="button" onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded">
                {t("save")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm({ ...emptyForm });
                  setErrors({});
                }}
                className="flex-1 py-2 rounded border"
              >
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
              <button
                type="button"
                onClick={() => {
                  removeGoal(pendingDeleteId);
                  setPendingDeleteId(null);
                }}
                className="flex-1 py-2 rounded bg-red-600 text-white"
              >
                {t("delete")}
              </button>
              <button type="button" onClick={() => setPendingDeleteId(null)} className="flex-1 py-2 rounded border">
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
