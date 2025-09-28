// src/components/Goals.tsx
import React, { useMemo, useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  Bell,
  X,
  Calendar,
} from "lucide-react";
import { Goal, Task } from "../types";

/**
 * ملاحظة: لو ملف types.ts عندك لا يحتوي Milestone أو الحقول التالية:
 * - completedDays?: string[]
 * - notifyTime?: string
 * - purpose?: string
 * فعليك إضافتها هناك كما أشرحت أعلاه.
 */

// تعريف محلي لـ Milestone لتجنّب أخطاء إن لم يكن معرفاً في types
interface Milestone {
  id: string;
  title: string;
  done?: boolean;
}

type Props = {
  goals: Goal[]; // يأتي من App.tsx (المخزن في LocalStorage عبر useLocalStorage)
  tasks: Task[];
  onGoalAdd: (g: Omit<Goal, "id">) => void; // إنشاء هدف جديد (App ينشئ id عادةً)
  onGoalUpdate: (g: Goal) => void;
  onGoalDelete?: (id: string) => void;
  language?: "ar" | "en";
};

const defaultLang = "ar";
const tr = {
  ar: {
    add: "إضافة",
    addGoal: "إضافة هدف",
    editGoal: "تعديل الهدف",
    delete: "حذف",
    deleteConfirm: "هل تريد حذف هذا الهدف؟",
    title: "عنوان الهدف",
    purpose: "الغرض من الهدف",
    start: "تاريخ البداية",
    end: "تاريخ الانتهاء",
    notify: "وقت التنبيه (اختياري)",
    save: "حفظ",
    cancel: "إلغاء",
    markToday: "وضع علامة اليوم",
    alreadyMarked: "سجلت علامة اليوم بالفعل",
    noGoals: "لا توجد أهداف بعد",
    testNotify: "تجربة التنبيه الآن",
  },
  en: {
    add: "Add",
    addGoal: "Add Goal",
    editGoal: "Edit Goal",
    delete: "Delete",
    deleteConfirm: "Delete this goal?",
    title: "Title",
    purpose: "Purpose",
    start: "Start date",
    end: "End date",
    notify: "Notify time (optional)",
    save: "Save",
    cancel: "Cancel",
    markToday: "Mark today",
    alreadyMarked: "Already marked today",
    noGoals: "No goals yet",
    testNotify: "Test notification now",
  },
};

export const Goals: React.FC<Props> = ({
  goals,
  tasks,
  onGoalAdd,
  onGoalUpdate,
  onGoalDelete,
  language = defaultLang,
}) => {
  const L = tr[language];

  // UI state (form + modal)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const emptyForm = {
    title: "",
    purpose: "",
    startDate: "",
    endDate: "",
    notifyTime: "",
    milestones: [] as Milestone[],
  };
  const [form, setForm] = useState(() => ({ ...emptyForm }));

  // helpers
  const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "");

  const totalDaysBetween = (startIso: string, endIso: string) => {
    const s = new Date(startIso);
    const e = new Date(endIso);
    // include both start and end
    const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  };

  const calcProgress = (g: Goal) => {
    const s = (g as any).startDate;
    const e = (g as any).endDate;
    const completedDays: string[] = (g as any).completedDays || [];
    if (!s || !e) return 0;
    const total = totalDaysBetween(s, e);
    return Math.min(100, Math.round((completedDays.length / total) * 100));
  };

  // فتح نموذج إضافة
  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  // فتح نموذج تعديل
  const openEdit = (g: Goal) => {
    setEditingId(g.id || null);
    setForm({
      title: (g as any).title || "",
      purpose: (g as any).purpose || "",
      startDate: (g as any).startDate || "",
      endDate: (g as any).endDate || "",
      notifyTime: (g as any).notifyTime || "",
      milestones: (g as any).milestones || [],
    });
    setShowForm(true);
  };

  // حفظ (إضافة أو تعديل)
  const handleSave = () => {
    // validations
    if (!form.title.trim()) return alert(L.title + " " + "required");
    if (!form.startDate || !form.endDate) return alert(L.start + " & " + L.end + " required");
    if (new Date(form.endDate) < new Date(form.startDate)) return alert("تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية");

    const payload: Omit<Goal, "id"> = {
      // اعتماد حقول مرنة لأن تعريف Goal قد يختلف عندك
      ...(null as any), // placeholder to keep TS happy in some strict configs; parent will accept shape
      title: form.title.trim(),
      purpose: form.purpose.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      notifyTime: form.notifyTime || undefined,
      milestones: form.milestones,
      // الحقول التالية متوقعة من الكود بين App و Goals:
      completedDays: (editingId ? (goals.find((gg) => gg.id === editingId) as any)?.completedDays || [] : []) as string[],
      updatedAt: Date.now(),
    } as any;

    if (editingId) {
      // تحديث — ينبغي أن يتضمن id
      const updated: Goal = { id: editingId, ...(payload as any) } as Goal;
      onGoalUpdate(updated);
    } else {
      // إضافة (App سيضيف id عادةً)
      onGoalAdd(payload);
    }

    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  // حذف: عرض نافذة تأكيد داخلية لتجنب سلوك confirm الافتراضي في بعض WebView
  const confirmDelete = (id: string) => {
    setConfirmDeleteId(id);
  };
  const doDelete = () => {
    if (!confirmDeleteId) return;
    if (onGoalDelete) onGoalDelete(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  // وضع علامة اليوم (مرة واحدة فقط في نفس اليوم)
  const markToday = (g: Goal) => {
    const today = new Date().toISOString().split("T")[0];
    const completedDays: string[] = (g as any).completedDays || [];
    if (completedDays.includes(today)) {
      alert(L.alreadyMarked);
      return;
    }
    const updated: Goal = {
      ...g,
      completedDays: [...completedDays, today],
      updatedAt: Date.now(),
    } as Goal;
    onGoalUpdate(updated);
  };

  // عرض نص توضيحي لزر التجربة: تُظهر إشعار فوري (إذا سمح المستخدم)
  const testNotifyNow = async (g: Goal) => {
    if (!("Notification" in window)) {
      alert("Notifications not supported in this browser");
      return;
    }
    if (Notification.permission === "granted") {
      new Notification((g as any).title || "Reminder", { body: (g as any).purpose || "Reminder from app" });
    } else {
      const p = await Notification.requestPermission();
      if (p === "granted") {
        new Notification((g as any).title || "Reminder", { body: (g as any).purpose || "Reminder from app" });
      } else {
        alert("Permission denied for notifications");
      }
    }
  };

  // بيانات محسوبة للعرض مع نسبة التقدم
  const computed = useMemo(() => {
    return goals.map((g) => {
      const progress = calcProgress(g);
      return { g, progress };
    });
  }, [goals]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">{language === "ar" ? "الأهداف" : "Goals"}</h2>
        </div>
        <div>
          <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded">
            <Plus className="w-4 h-4" /> {L.addGoal}
          </button>
        </div>
      </div>

      {/* قائمة الأهداف */}
      {computed.length === 0 ? (
        <div className="p-6 text-center text-gray-500 rounded border">{L.noGoals}</div>
      ) : (
        <div className="space-y-4">
          {computed.map(({ g, progress }) => {
            const completed = progress >= 100;
            return (
              <div key={(g as any).id} className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{(g as any).title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {completed ? (language === "ar" ? "منجز" : "Achieved") : `${progress}%`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 my-1">{(g as any).purpose}</p>
                    <div className="text-xs text-gray-500 flex items-center gap-3">
                      <Calendar className="w-4 h-4" />
                      <span>{fmtDate((g as any).startDate)} → {fmtDate((g as any).endDate)}</span>
                      {(g as any).notifyTime && (
                        <span className="flex items-center gap-1 ml-3 text-gray-500">
                          <Bell className="w-4 h-4" /> {(g as any).notifyTime}
                        </span>
                      )}
                    </div>

                    {/* شريط التقدم */}
                    <div className="mt-3">
                      <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                        <div style={{ width: `${progress}%` }} className={`h-2 ${progress >= 100 ? "bg-green-400" : "bg-blue-500"}`} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{progress}%</div>
                    </div>
                  </div>

                  {/* أزرار العمليات */}
                  <div className="flex flex-col items-center gap-2">
                    <button type="button" onClick={() => openEdit(g)} title={language === "ar" ? "تعديل" : "Edit"} className="p-2 rounded hover:bg-gray-100">
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {onGoalDelete && (
                      <button type="button" onClick={() => confirmDelete((g as any).id)} title={language === "ar" ? "حذف" : "Delete"} className="p-2 rounded hover:bg-gray-100 text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button type="button" onClick={() => markToday(g)} title={L.markToday} className="p-2 rounded hover:bg-gray-100 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                    </button>

                    {(g as any).notifyTime && (
                      <button type="button" onClick={() => testNotifyNow(g)} title={L.testNotify} className="p-2 rounded hover:bg-gray-100 text-yellow-600">
                        <Bell className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نموذج الإضافة / التعديل */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{editingId ? L.editGoal : L.addGoal}</h3>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); }} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm">{L.title}</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full p-2 border rounded" />
              </div>

              <div>
                <label className="block text-sm">{L.purpose}</label>
                <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full p-2 border rounded" />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm">{L.start}</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full p-2 border rounded" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm">{L.end}</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full p-2 border rounded" />
                </div>
              </div>

              <div>
                <label className="block text-sm">{L.notify}</label>
                <input type="time" value={form.notifyTime} onChange={(e) => setForm({ ...form, notifyTime: e.target.value })} className="w-full p-2 border rounded" />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleSave} className="flex-1 py-2 bg-blue-600 text-white rounded">{L.save}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); }} className="flex-1 py-2 rounded border">{L.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded max-w-sm w-full">
            <p className="mb-4">{language === "ar" ? tr.ar.deleteConfirm : tr.en.deleteConfirm}</p>
            <div className="flex gap-2">
              <button type="button" onClick={doDelete} className="flex-1 py-2 bg-red-600 text-white rounded">{L.delete}</button>
              <button type="button" onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 rounded border">{L.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
