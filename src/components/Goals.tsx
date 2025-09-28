// src/components/Goals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, CheckCircle, Bell, X, Calendar } from "lucide-react";

/**
 * Types (إذا عندك ملف src/types.ts يمكنك إزالة/تعديل هذه الواجهات هناك)
 */

export interface Milestone {
  id: string;
  title: string;
  done?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  purpose?: string;
  startDate: string;
  endDate: string;
  notifyTime?: string;
  completedDays?: string[];
  milestones?: Milestone[];
  updatedAt?: number;
}

/**
 * Props:
 * - إذا مررت goals و callbacks من App.tsx فالمكوّن يستخدمها.
 * - إذا لم تمرر callbacks، المكوّن يخزّن في localStorage كـ fallback.
 */
type Props = {
  goals?: Goal[]; // من المحتمل App يمرّره (المخزن في useLocalStorage)
  onGoalAdd?: (g: Omit<Goal, "id">) => void;
  onGoalUpdate?: (g: Goal) => void;
  onGoalDelete?: (id: string) => void;
  language?: "ar" | "en";
};

const FALLBACK_KEY = "achiveo_goals_fallback_v1";

const translations = {
  ar: {
    header: "الأهداف",
    addGoal: "إضافة هدف",
    editGoal: "تعديل الهدف",
    title: "اسم الهدف",
    purpose: "الغرض من الهدف",
    start: "تاريخ البداية",
    end: "تاريخ النهاية",
    notify: "وقت التنبيه (اختياري)",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    markToday: "وضع علامة اليوم",
    alreadyMarked: "سجّلت إنجاز اليوم لهذا الهدف بالفعل",
    noGoals: "لا توجد أهداف بعد",
    testNotify: "جرّب التنبيه الآن",
    deleteConfirm: "هل تريد حذف هذا الهدف؟",
    invalidDates: "تأكد أن تاريخ النهاية بعد تاريخ البداية",
    required: "املأ الحقول المطلوبة",
  },
  en: {
    header: "Goals",
    addGoal: "Add Goal",
    editGoal: "Edit Goal",
    title: "Title",
    purpose: "Purpose",
    start: "Start date",
    end: "End date",
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
    required: "Please fill required fields",
  },
} as const;

export function Goals(props: Props) {
  const { goals: parentGoals, onGoalAdd, onGoalUpdate, onGoalDelete, language = "ar" } = props;
  const t = (k: keyof typeof translations["ar"]) => translations[language][k];

  // --- local fallback state (used only if parentCallbacks not provided) ---
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
    } catch {
      // ignore storage errors
    }
  }, [fallbackGoals]);

  // use parent goals if provided, else fallback
  const goals = parentGoals && parentGoals.length > 0 ? parentGoals : fallbackGoals;

  // modal/form UI state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyForm = { title: "", purpose: "", startDate: "", endDate: "", notifyTime: "" };
  const [form, setForm] = useState(() => ({ ...emptyForm }));

  // confirm delete modal
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // helpers
  const isoToday = () => new Date().toISOString().split("T")[0];

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

  // unified mutators: either call parent callbacks or update fallback
  const addGoal = (payload: Omit<Goal, "id">) => {
    if (onGoalAdd) {
      onGoalAdd(payload);
      return;
    }
    // fallback: create id and save locally
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

  // form open for add
  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  };

  // form open for edit
  const openEdit = (g: Goal) => {
    setForm({
      title: g.title,
      purpose: g.purpose || "",
      startDate: g.startDate,
      endDate: g.endDate,
      notifyTime: g.notifyTime || "",
    });
    setEditingId(g.id);
    setShowForm(true);
  };

  const handleSave = () => {
    // basic validation
    if (!form.title.trim() || !form.startDate || !form.endDate) {
      alert(t("required"));
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      alert(t("invalidDates"));
      return;
    }

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
  };

  // mark today (only once per day)
  const markToday = (g: Goal) => {
    const today = isoToday();
    const days = g.completedDays || [];
    if (days.includes(today)) {
      alert(t("alreadyMarked"));
      return;
    }
    const updated: Goal = { ...g, completedDays: [...days, today], updatedAt: Date.now() };
    updateGoal(updated);
  };

  // test web notification
  const testNotifyNow = async (g: Goal) => {
    if (!("Notification" in window)) {
      alert("Notifications not supported");
      return;
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

  // computed list with progress
  const list = useMemo(() => {
    return (goals || []).slice().map((g) => ({ ...g, __progress: calcProgress(g) }));
  }, [goals]);

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">{t("header")}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">تابع أهدافك وعلّم كل يوم بضغطه واحدة</p>
        </div>

        <div>
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
                      <span>{g.startDate} → {g.endDate}</span>
                      {g.notifyTime && (
                        <span className="flex items-center gap-1 ml-2">
                          <Bell className="w-4 h-4" /> <span>{g.notifyTime}</span>
                        </span>
                      )}
                    </div>

                    {/* progress bar */}
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

      {/* form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-5 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{editingId ? translations[language].editGoal : translations[language].addGoal}</h3>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); }} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">{translations[language].title}</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-800" />
              </div>

              <div>
                <label className="block text-sm font-medium">{translations[language].purpose}</label>
                <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-800" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm">{translations[language].start}</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block text-sm">{translations[language].end}</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-800" />
                </div>
              </div>

              <div>
                <label className="block text-sm">{translations[language].notify}</label>
                <input type="time" value={form.notifyTime} onChange={(e) => setForm({ ...form, notifyTime: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-800" />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded">{translations[language].save}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); }} className="flex-1 py-2 rounded border">{translations[language].cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* delete confirmation */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded p-4 w-full max-w-sm">
            <p className="mb-4 text-gray-700 dark:text-gray-200">{translations[language].deleteConfirm}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { deleteGoal(pendingDeleteId); setPendingDeleteId(null); }} className="flex-1 py-2 rounded bg-red-600 text-white">{translations[language].delete}</button>
              <button type="button" onClick={() => setPendingDeleteId(null)} className="flex-1 py-2 rounded border">{translations[language].cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Goals;
