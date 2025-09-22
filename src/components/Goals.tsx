import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  Award,
  CheckCircle,
  Edit,
  Trash2,
  X,
  List,
} from "lucide-react";
import { Goal, Task } from "../types";

interface GoalsProps {
  goals: Goal[];
  tasks: Task[];
  onGoalAdd: (goal: Omit<Goal, "id">) => void;
  onGoalUpdate: (goal: Goal) => void;
  onGoalDelete?: (id: string) => void; // optional: pass from parent to enable delete
  language: "ar" | "en";
}

export const Goals: React.FC<GoalsProps> = ({
  goals,
  tasks,
  onGoalAdd,
  onGoalUpdate,
  onGoalDelete,
  language,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const [viewTasksGoalId, setViewTasksGoalId] = useState<string | null>(null);

  const defaultCategory = language === "ar" ? "عام" : "General";

  const [formState, setFormState] = useState({
    title: "",
    target: 5,
    type: "daily" as "daily" | "weekly",
    category: defaultCategory,
  });

  const [errors, setErrors] = useState<{ title?: string; target?: string }>({});

  // Translations
  const translations = {
    ar: {
      title: "الأهداف",
      subtitle: "حدد أهدافك وتابع تقدمك",
      addGoal: "إضافة هدف جديد",
      totalGoals: "إجمالي الأهداف",
      achieved: "أهداف محققة",
      progressRate: "معدل الإنجاز",
      formTitleAdd: "إضافة هدف جديد",
      formTitleEdit: "تعديل الهدف",
      goalTitle: "عنوان الهدف",
      goalTarget: "الهدف المطلوب",
      type: "النوع",
      daily: "يومي",
      weekly: "أسبوعي",
      category: "الفئة",
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      noGoals: "لا توجد أهداف بعد",
      start: "ابدأ بتحديد أهدافك لزيادة إنتاجيتك",
      completed: "تم تحقيق الهدف! 🎉",
      dailyGoal: "هدف يومي",
      weeklyGoal: "هدف أسبوعي",
      viewTasks: "عرض المهام المساهمة",
      close: "إغلاق",
      confirmDelete: "هل أنت متأكد أنك تريد حذف هذا الهدف؟",
      invalidTitle: "اكتب عنوانًا صالحًا",
      invalidTarget: "الهدف يجب أن يكون عددًا صحيحًا ≥ 1",
      lastUpdated: "آخر تحديث",
    },
    en: {
      title: "Goals",
      subtitle: "Set your goals and track progress",
      addGoal: "Add New Goal",
      totalGoals: "Total Goals",
      achieved: "Achieved Goals",
      progressRate: "Progress Rate",
      formTitleAdd: "Add New Goal",
      formTitleEdit: "Edit Goal",
      goalTitle: "Goal Title",
      goalTarget: "Target Value",
      type: "Type",
      daily: "Daily",
      weekly: "Weekly",
      category: "Category",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      noGoals: "No goals yet",
      start: "Start by setting your goals to boost productivity",
      completed: "Goal Achieved! 🎉",
      dailyGoal: "Daily Goal",
      weeklyGoal: "Weekly Goal",
      viewTasks: "View contributing tasks",
      close: "Close",
      confirmDelete: "Are you sure you want to delete this goal?",
      invalidTitle: "Please enter a valid title",
      invalidTarget: "Target must be an integer ≥ 1",
      lastUpdated: "Last updated",
    },
  };

  const t = (k: keyof typeof translations["ar"]) => translations[language][k];

  // Helper: calculate tasks that contribute to a goal (memoized)
  const tasksForGoal = useCallback(
    (goal: Goal) => {
      const now = new Date();
      if (goal.type === "daily") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return tasks.filter((task) => {
          const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
          const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
          return taskDay.getTime() === today.getTime() && task.category === goal.category && task.completed;
        });
      } else {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return tasks.filter((task) => {
          const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
          return taskDate >= startOfWeek && task.category === goal.category && task.completed;
        });
      }
    },
    [tasks]
  );

  // compute statistics
  const stats = useMemo(() => {
    const total = goals.length;
    const achieved = goals.filter((g) => tasksForGoal(g).length >= g.target).length;
    const rate = total > 0 ? Math.round((achieved / total) * 100) : 0;
    return { total, achieved, rate };
  }, [goals, tasksForGoal]);

  // prepare grouped categories suggestions from tasks
  const categorySuggestions = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(t.category || defaultCategory));
    return Array.from(set);
  }, [tasks, defaultCategory]);

  // open add modal and reset state
  const openAdd = () => {
    setErrors({});
    setFormState({
      title: "",
      target: 5,
      type: "daily",
      category: defaultCategory,
    });
    setShowAddForm(true);
    setEditGoalId(null);
  };

  // open edit modal with data
  const openEdit = (goal: Goal) => {
    setErrors({});
    setEditGoalId(goal.id);
    setFormState({
      title: goal.title,
      target: goal.target,
      type: goal.type,
      category: goal.category,
    });
    setShowAddForm(true);
  };

  // validate form
  const validateForm = () => {
    const e: typeof errors = {};
    if (!formState.title || !formState.title.trim()) e.title = t("invalidTitle");
    if (!Number.isInteger(formState.target) || formState.target < 1) e.target = t("invalidTarget");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // handle save (add or update)
  const handleSave = () => {
    if (!validateForm()) return;
    if (editGoalId) {
      // update
      onGoalUpdate({
        id: editGoalId,
        title: formState.title.trim(),
        target: formState.target,
        current: 0,
        type: formState.type,
        category: formState.category,
        updatedAt: Date.now(),
      } as Goal);
    } else {
      // add
      onGoalAdd({
        title: formState.title.trim(),
        target: formState.target,
        current: 0,
        type: formState.type,
        category: formState.category,
      });
    }
    setShowAddForm(false);
    setEditGoalId(null);
  };

  const handleDelete = (id: string) => {
    if (!onGoalDelete) return;
    const ok = confirm(t("confirmDelete"));
    if (ok) onGoalDelete(id);
  };

  // keyboard escape to close modal(s)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddForm(false);
        setViewTasksGoalId(null);
        setEditGoalId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // small util to format "last updated" (relative)
  const relativeTime = (ts?: number) => {
    if (!ts) return "";
    const diff = Date.now() - ts;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-gray-600 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAdd}
            aria-label={t("addGoal")}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-shadow shadow"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("addGoal")}</span>
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-sm">{t("totalGoals")}</p>
          <div className="text-3xl font-bold">{stats.total}</div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-sm">{t("achieved")}</p>
          <div className="text-3xl font-bold">{stats.achieved}</div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <p className="text-sm">{t("progressRate")}</p>
          <div className="text-3xl font-bold">{stats.rate}%</div>
        </div>
      </div>

      {/* Goals list */}
      <div className="space-y-4">
        {goals.map((goal) => {
          const contributingTasks = useMemo(() => tasksForGoal(goal), [goal, tasksForGoal]);
          const current = contributingTasks.length;
          const percentage = Math.min(Math.round((current / goal.target) * 100), 100);
          const statusColor =
            percentage >= 100 ? "green" : percentage >= 75 ? "blue" : percentage >= 50 ? "yellow" : "red";

          return (
            <div key={goal.id} className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Target className={`w-5 h-5 ${statusColor === "green" ? "text-green-500" : statusColor === "blue" ? "text-blue-500" : statusColor === "yellow" ? "text-yellow-500" : "text-red-500"}`} />
                    <h3 className="text-lg font-semibold">{goal.title}</h3>
                    <span className="text-sm text-gray-500 ml-2">{goal.category}</span>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full ${statusColor === "green" ? "bg-green-400" : statusColor === "blue" ? "bg-blue-400" : statusColor === "yellow" ? "bg-yellow-400" : "bg-red-400"}`}
                        style={{ width: `${percentage}%` }}
                        aria-valuenow={percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        role="progressbar"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                      <div>
                        {current}/{goal.target} • {percentage}% 
                        <span className="ml-2 text-xs text-gray-400">• {goal.type === "daily" ? t("dailyGoal") : t("weeklyGoal")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewTasksGoalId(viewTasksGoalId === goal.id ? null : goal.id)}
                          className="text-sm px-2 py-1 rounded hover:bg-gray-100"
                          aria-expanded={viewTasksGoalId === goal.id}
                          aria-controls={`goal-tasks-${goal.id}`}
                          title={t("viewTasks")}
                        >
                          <List className="w-4 h-4 inline" /> <span className="sr-only">{t("viewTasks")}</span>
                        </button>

                        <button
                          onClick={() => openEdit(goal)}
                          className="text-sm px-2 py-1 rounded hover:bg-gray-100"
                          title={language === "ar" ? "تعديل" : "Edit"}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {onGoalDelete && (
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="text-sm px-2 py-1 rounded hover:bg-gray-100 text-red-600"
                            title={t("delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold">{current}/{goal.target}</div>
                  <div className={`text-sm font-medium ${statusColor === "green" ? "text-green-600" : statusColor === "blue" ? "text-blue-600" : statusColor === "yellow" ? "text-yellow-600" : "text-red-600"}`}>
                    {percentage}%
                  </div>
                </div>
              </div>

              {/* tasks list (collapsible) */}
              {viewTasksGoalId === goal.id && (
                <div id={`goal-tasks-${goal.id}`} className="mt-4 border-t pt-3">
                  {contributingTasks.length === 0 ? (
                    <p className="text-sm text-gray-500">{language === "ar" ? "لا توجد مهام مساهمة بعد" : "No contributing tasks yet"}</p>
                  ) : (
                    
                    <ul className="space-y-2">
  {contributingTasks.map((task) => (
    <li
      key={task.id}
      className="flex items-center justify-between bg-gray-50 p-2 rounded"
    >
      <div>
        <div className="font-medium">{task.title}</div>
        <div className="text-xs text-gray-500">
          {task.dueDate
            ? new Date(task.dueDate).toLocaleString()
            : new Date(task.createdAt).toLocaleString()}
        </div>
      </div>
      <div className="text-sm text-gray-600">
                                                        {task.completed
          ? language === "ar"
            ? "مكتملة"
            : "Done"
          : language === "ar"
          ? "قيد الإنجاز"
          : "In progress"}
      </div>
    </li>
  ))}
</ul>

                    
                    
                    
                  )}
                </div>
              )}
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noGoals")}</h3>
            <p className="text-gray-600 mb-4">{t("start")}</p>
            <button onClick={openAdd} className="bg-blue-600 text-white px-6 py-2 rounded">{t("addGoal")}</button>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label={editGoalId ? t("formTitleEdit") : t("formTitleAdd")}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editGoalId ? t("formTitleEdit") : t("formTitleAdd")}</h3>
              <button onClick={() => { setShowAddForm(false); setEditGoalId(null); }} aria-label={t("close")} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t("goalTitle")}</label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className={`w-full p-2 border rounded ${errors.title ? "border-red-400" : "border-gray-300"}`}
                  aria-invalid={!!errors.title}
                />
                {errors.title && <div className="text-xs text-red-500 mt-1">{errors.title}</div>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("goalTarget")}</label>
                  <input
                    type="number"
                    min={1}
                    value={formState.target}
                    onChange={(e) => setFormState({ ...formState, target: Math.max(1, parseInt(e.target.value || "1")) })}
                    className={`w-full p-2 border rounded ${errors.target ? "border-red-400" : "border-gray-300"}`}
                    aria-invalid={!!errors.target}
                  />
                  {errors.target && <div className="text-xs text-red-500 mt-1">{errors.target}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t("type")}</label>
                  <select value={formState.type} onChange={(e) => setFormState({ ...formState, type: e.target.value as "daily" | "weekly" })} className="w-full p-2 border rounded">
                    <option value="daily">{t("daily")}</option>
                    <option value="weekly">{t("weekly")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t("category")}</label>
                <input
                  list="cat-suggestions"
                  value={formState.category}
                  onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <datalist id="cat-suggestions">
                  {categorySuggestions.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">{t("save")}</button>
              <button onClick={() => { setShowAddForm(false); setEditGoalId(null); }} className="flex-1 bg-gray-200 py-2 rounded">{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
