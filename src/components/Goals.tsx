// src/components/Goals.tsx
import React, { useMemo, useState } from "react";
import { Goal, Task } from "../types"; // يستخدم types الموجودة في مشروعك
import { Calendar, Plus, Edit3, Trash2, CheckCircle, Circle } from "lucide-react";

type Props = {
  goals: Goal[];
  tasks: Task[];
  onGoalAdd: (newGoal: Omit<Goal, "id">) => void;
  onGoalUpdate: (updatedGoal: Goal) => void;
  language?: string;
};

type Milestone = { id: string; title: string; done?: boolean };

const Goals: React.FC<Props> = ({ goals, tasks, onGoalAdd, onGoalUpdate, language = "ar" }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  // نموذج إضافة / تحرير
  const initialForm = {
    title: "",
    description: "",
    targetDate: "",
    milestones: [] as Milestone[],
  };

  const [form, setForm] = useState<typeof initialForm>(initialForm);

  // حساب التقدّم لكل هدف: يعتمد أولًا على tasks المرتبطة بالهدف
  const calcProgress = (goal: Goal) => {
    // اجمع المهام التي ترتبط بالهدف عبر goalId أو اسم الهدف
    const related = tasks.filter((t: any) => {
      try {
        return (t.goalId && String(t.goalId) === String(goal.id)) || (t.goal && String(t.goal) === String(goal.title));
      } catch {
        return false;
      }
    });

    if (related.length > 0) {
      const completed = related.filter((t: any) => !!t.completed).length;
      return Math.round((completed / related.length) * 100);
    }

    // إن لم توجد مهام مرتبطة، احسب التقدّم بناءً على المعالم داخل الهدف (إن وُجدت)
    if ((goal as any).milestones && (goal as any).milestones.length > 0) {
      const ms = (goal as any).milestones as Milestone[];
      const done = ms.filter((m) => m.done).length;
      return Math.round((done / ms.length) * 100);
    }

    return 0;
  };

  // فتح قالب التحرير مع ملأ الحقول
  const startEdit = (g: Goal) => {
    setEditing(g);
    setForm({
      title: g.title || "",
      description: (g as any).description || "",
      targetDate: (g as any).targetDate || "",
      milestones: ((g as any).milestones || []).map((m: any) => ({ id: m.id || String(Math.random()), title: m.title, done: !!m.done })),
    });
    setShowAdd(true);
  };

  const resetForm = () => {
    setForm(initialForm);
    setShowAdd(false);
    setEditing(null);
  };

  // إضافة معلم جديد في النموذج
  const addMilestone = () => {
    setForm((f) => ({ ...f, milestones: [...f.milestones, { id: Date.now().toString(), title: "", done: false }] }));
  };
  const updateMilestoneTitle = (id: string, title: string) => {
    setForm((f) => ({ ...f, milestones: f.milestones.map((m) => (m.id === id ? { ...m, title } : m)) }));
  };
  const toggleMilestoneDone = (id: string) => {
    setForm((f) => ({ ...f, milestones: f.milestones.map((m) => (m.id === id ? { ...m, done: !m.done } : m)) }));
  };
  const removeMilestone = (id: string) => {
    setForm((f) => ({ ...f, milestones: f.milestones.filter((m) => m.id !== id) }));
  };

  const handleSubmit = () => {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return;

    const payload: any = {
      title: trimmedTitle,
      // اضف الحقول الاختيارية إذا وُجدت
      description: form.description.trim() || "",
      targetDate: form.targetDate || "",
      milestones: form.milestones.map((m) => ({ id: m.id, title: m.title, done: !!m.done })),
    };

    if (editing) {
      const updated: Goal = { ...editing, ...payload };
      onGoalUpdate(updated);
    } else {
      onGoalAdd(payload as Omit<Goal, "id">);
    }

    resetForm();
  };

  const toggleCompleteGoal = (g: Goal) => {
    const updated: Goal = { ...g, completed: !((g as any).completed) };
    onGoalUpdate(updated);
  };

  const goalList = useMemo(() => goals.slice().reverse(), [goals]); // أحدث أولاً

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">
          🎯 {language === "ar" ? "الأهداف" : "Goals"}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowAdd((s) => !s);
              if (!showAdd) {
                setEditing(null);
                setForm(initialForm);
              }
            }}
            className="px-3 py-1 rounded bg-blue-500 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {language === "ar" ? "إضافة هدف" : "Add Goal"}
          </button>
        </div>
      </div>

      {/* قائمة الأهداف */}
      <div className="space-y-3">
        {goalList.length === 0 && (
          <div className="text-gray-500">{language === "ar" ? "لا يوجد أهداف بعد" : "No goals yet"}</div>
        )}

        {goalList.map((g) => {
          const progress = calcProgress(g);
          return (
            <div key={(g as any).id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{g.title}</h3>
                    {((g as any).completed) ? <span className="text-green-500 text-sm">({language === "ar" ? "مكتمل" : "Completed"})</span> : null}
                  </div>
                  {((g as any).targetDate) && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date((g as any).targetDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button title={language === "ar" ? "تعديل" : "Edit"} onClick={() => startEdit(g)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button title={language === "ar" ? "انهاء/فتح" : "Toggle complete"} onClick={() => toggleCompleteGoal(g)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    {((g as any).completed) ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* شريط التقدّم */}
              <div>
                <div className="text-xs text-gray-500 mb-1">{progress}%</div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                  <div style={{ width: `${progress}%` }} className="h-full bg-blue-500" />
                </div>
              </div>

              {/* وصف ومعالم مختصرة */}
              {((g as any).description) && <div className="text-sm text-gray-700 dark:text-gray-300">{(g as any).description}</div>}

              {((g as any).milestones && (g as any).milestones.length > 0) && (
                <div className="flex gap-2 flex-wrap">
                  {((g as any).milestones).slice(0, 4).map((m: any) => (
                    <span key={m.id} className={`text-xs px-2 py-1 rounded ${m.done ? "bg-green-100 dark:bg-green-800" : "bg-gray-100 dark:bg-gray-700"}`}>
                      {m.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* نموذج الإضافة / التحرير */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100">
            <h2 className="text-lg font-bold mb-3">
              {editing ? (language === "ar" ? "تعديل الهدف" : "Edit Goal") : (language === "ar" ? "هدف جديد" : "New Goal")}
            </h2>

            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={language === "ar" ? "عنوان الهدف" : "Goal title"}
                className="w-full p-2 border rounded dark:bg-gray-900"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={language === "ar" ? "وصف مختصر" : "Short description"}
                className="w-full p-2 border rounded dark:bg-gray-900"
              />

              <div>
                <label className="text-sm">{language === "ar" ? "تاريخ مستهدف" : "Target date"}</label>
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-900 mt-1"
                />
              </div>

              {/* المعالم */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold">{language === "ar" ? "معالم الهدف" : "Milestones"}</label>
                  <button onClick={addMilestone} className="text-sm text-blue-600 flex items-center gap-1"><Plus className="w-4 h-4" />{language === "ar" ? "إضافة" : "Add"}</button>
                </div>

                <div className="space-y-2">
                  {form.milestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={!!m.done} onChange={() => toggleMilestoneDone(m.id)} />
                      <input value={m.title} onChange={(e) => updateMilestoneTitle(m.id, e.target.value)} placeholder={language === "ar" ? "عنوان المعلم" : "Milestone title"} className="flex-1 p-2 border rounded dark:bg-gray-900" />
                      <button onClick={() => removeMilestone(m.id)} className="px-2 py-1 rounded bg-red-500 text-white text-sm">
                        {language === "ar" ? "حذف" : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={handleSubmit} className="flex-1 py-2 rounded bg-blue-500 text-white">
                  {editing ? (language === "ar" ? "حفظ التغييرات" : "Save changes") : (language === "ar" ? "إنشاء الهدف" : "Create goal")}
                </button>
                <button onClick={resetForm} className="flex-1 py-2 rounded bg-gray-500 text-white">
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
