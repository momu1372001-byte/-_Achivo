// src/components/Goals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, CheckCircle, Bell, X, Calendar } from "lucide-react";

/** نوع الهدف */
type GoalItem = {
  id: string;
  title: string;
  purpose?: string;
  startDate?: string;
  endDate?: string;
  notifyTime?: string;
  notifyMarked?: boolean; // ✅ حالة بسيطة لتوضيح أنه تم ضبط التذكير
  completedDays?: string[];
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
    alreadyMarked: "سجّلت اليوم بالفعل",
    noGoals: "لا توجد أهداف بعد",
    deleteConfirm: "هل تريد حذف هذا الهدف؟",
    invalidDates: "تأكد أن تاريخ النهاية بعد البداية",
    required: "هذا الحقل مطلوب",
    added: "تم إضافة الهدف",
    updated: "تم تحديث الهدف",
    deleted: "تم حذف الهدف",
    reminderSet: "تم ضبط التذكير",
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
    alreadyMarked: "Already marked",
    noGoals: "No goals yet",
    deleteConfirm: "Delete this goal?",
    invalidDates: "Make sure end date is after start date",
    required: "This field is required",
    added: "Goal added",
    updated: "Goal updated",
    deleted: "Goal deleted",
    reminderSet: "Reminder set",
  },
} as const;

export default function Goals(props: Props) {
  const { goals: parentGoals, onGoalAdd, onGoalUpdate, onGoalDelete, language = "ar" } = props;
  const t = (k: keyof typeof tr["ar"]) => tr[language][k];

  const [toast, setToast] = useState<{ goalId: string; text: string } | null>(null);

  const showToast = (goalId: string, text: string) => {
    setToast({ goalId, text });
    setTimeout(() => setToast(null), 2000);
  };

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

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

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

  const addGoal = (payload: Omit<GoalItem, "id">) => {
    if (onGoalAdd) {
      onGoalAdd(payload);
      return;
    }
    const g: GoalItem = { id: Date.now().toString(), ...payload, updatedAt: Date.now() };
    setFallbackGoals((s) => [g, ...s]);
    showToast(g.id, t("added"));
  };

  const updateGoal = (g: GoalItem) => {
    if (onGoalUpdate) {
      onGoalUpdate(g);
      return;
    }
    setFallbackGoals((s) => s.map((x) => (x.id === g.id ? { ...g, updatedAt: Date.now() } : x)));
    showToast(g.id, t("updated"));
  };

  const removeGoal = (id: string) => {
    if (onGoalDelete) {
      onGoalDelete(id);
      return;
    }
    setFallbackGoals((s) => s.filter((gg) => gg.id !== id));
    showToast(id, t("deleted"));
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

  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (g: GoalItem) => {
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
    const base: Omit<GoalItem, "id"> = {
      title: form.title.trim(),
      purpose: form.purpose.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      notifyTime: form.notifyTime || undefined,
      completedDays: editingId ? (goals.find((x) => x.id === editingId)?.completedDays || []) : [],
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

  const markToday = (g: GoalItem) => {
    const today = isoToday();
    const days = g.completedDays || [];
    if (days.includes(today)) {
      showToast(g.id, t("alreadyMarked"));
      return;
    }
    const updated: GoalItem = { ...g, completedDays: [...days, today], updatedAt: Date.now() };
    updateGoal(updated);
    showToast(g.id, "✓");
  };

  const list = useMemo(() => (goals || []).slice().map((g) => ({ ...g, __progress: calcProgress(g) })), [goals]);

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">{t("header")}</h2>
        </div>
        <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded shadow">
          <Plus className="w-4 h-4" />
          <span>{t("addGoal")}</span>
        </button>
      </div>

      {/* list */}
      {list.length === 0 ? (
        <div className="p-6 text-center rounded border bg-gray-50 dark:bg-gray-800 text-gray-500">{t("noGoals")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((g: any) => {
            const progress = g.__progress as number;
            const completed = progress >= 100;
            return (
              <article key={g.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm flex flex-col">
                <header className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{g.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{g.purpose}</p>
                  </div>

                  {/* buttons */}
                  <div className="flex flex-col items-center gap-2">
                    <button type="button" onClick={() => markToday(g)} className="p-2 rounded text-green-600">
                      <CheckCircle className="w-5 h-5" />
                    </button>

                    <button type="button" onClick={() => openEdit(g)} className="p-2 rounded">
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button type="button" onClick={() => setPendingDeleteId(g.id)} className="p-2 rounded text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...g, notifyMarked: true };
                        updateGoal(updated);
                        showToast(g.id, t("reminderSet"));
                      }}
                      className={`p-2 rounded ${g.notifyMarked ? "text-yellow-600" : "text-gray-400"}`}
                    >
                      <Bell className="w-5 h-5" />
                    </button>
                    {toast && toast.goalId === g.id && (
                      <div className="text-xs mt-1 text-blue-600">{toast.text}</div>
                    )}
                  </div>
                </header>
              </article>
            );
          })}
        </div>
      )}

      {/* form modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-5 w-full max-w-md">
            <div className="flex justify-between mb-3">
              <h3 className="text-lg font-semibold">{editingId ? t("editGoal") : t("addGoal")}</h3>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input type="text" placeholder={t("title")} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full p-2 border rounded" />
              <textarea placeholder={t("purpose")} value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} className="w-full p-2 border rounded" />
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full p-2 border rounded" />
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full p-2 border rounded" />
              <input type="time" value={form.notifyTime} onChange={(e) => setForm((f) => ({ ...f, notifyTime: e.target.value }))} className="w-full p-2 border rounded" />
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded">{t("save")}</button>
              <button onClick={() => setShowForm(false)} className="flex-1 border py-2 rounded">{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {/* delete confirm */}
      {pendingDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 p-4 rounded">
            <p className="mb-4">{t("deleteConfirm")}</p>
            <div className="flex gap-2">
              <button onClick={() => { removeGoal(pendingDeleteId); setPendingDeleteId(null); }} className="flex-1 bg-red-600 text-white py-2 rounded">{t("delete")}</button>
              <button onClick={() => setPendingDeleteId(null)} className="flex-1 border py-2 rounded">{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
