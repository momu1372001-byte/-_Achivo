// src/components/Goals.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  Target,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Filter,
  Award,
  List,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Goal, Task, Milestone } from "../types";

interface GoalsProps {
  goals: Goal[];
  tasks: Task[];
  onGoalAdd: (goal: Omit<Goal, "id">) => void;
  onGoalUpdate: (goal: Goal) => void;
  onGoalDelete?: (id: string) => void;
  language: "ar" | "en";
}

type Horizon = "short" | "long";
type Priority = "low" | "medium" | "high";

interface FormState {
  title: string;
  target: number;
  type: "daily" | "weekly";
  category: string;
  horizon: Horizon;
  priority: Priority;
  deadline?: string;
  milestones: Milestone[];
}

const translations = {
  ar: {
    all: "الكل",
    short: "قصيرة الأمد",
    long: "طويلة الأمد",
    searchPlaceholder: "ابحث عن هدف أو فئة...",
    addGoal: "إضافة هدف",
    editGoal: "تعديل الهدف",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    milestones: "الخطوات",
    addMilestone: "أضف خطوة",
    horizon: "أفق الهدف",
    deadline: "الموعد النهائي",
    noGoals: "لا توجد أهداف حتى الآن",
    viewTasks: "عرض المهام المساهمة",
    priorityLow: "منخفضة",
    priorityMed: "متوسطة",
    priorityHigh: "عالية",
    targetLabel: "الهدف المطلوب",
    typeLabel: "النوع",
    categoryLabel: "الفئة",
    priorityLabel: "الأولوية",
    lastUpdated: "آخر تحديث",
    titleRequired: "العنوان مطلوب",
    targetInvalid: "القيمة يجب أن تكون على الأقل 1",
    saved: "تم حفظ الهدف بنجاح!",
    updated: "تم تحديث الهدف بنجاح!",
    deleted: "تم حذف الهدف!",
  },
  en: {
    all: "All",
    short: "Short-term",
    long: "Long-term",
    searchPlaceholder: "Search goals or category...",
    addGoal: "Add Goal",
    editGoal: "Edit Goal",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    milestones: "Milestones",
    addMilestone: "Add milestone",
    horizon: "Horizon",
    deadline: "Deadline",
    noGoals: "No goals yet",
    viewTasks: "View contributing tasks",
    priorityLow: "Low",
    priorityMed: "Medium",
    priorityHigh: "High",
    targetLabel: "Target",
    typeLabel: "Type",
    categoryLabel: "Category",
    priorityLabel: "Priority",
    lastUpdated: "Last updated",
    titleRequired: "Title is required",
    targetInvalid: "Target must be at least 1",
    saved: "Goal saved successfully!",
    updated: "Goal updated successfully!",
    deleted: "Goal deleted!",
  },
} as const;

export const Goals: React.FC<GoalsProps> = ({
  goals,
  tasks,
  onGoalAdd,
  onGoalUpdate,
  onGoalDelete,
  language,
}) => {
  const dir = language === "ar" ? "rtl" : "ltr";
  const t = (k: keyof typeof translations["ar"]) => translations[language][k];

  const defaultCategory = language === "ar" ? "عام" : "General";

  // UI state
  type Tab = "all" | "short" | "long";
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"progress" | "newest" | "oldest" | "priority">(
    "progress"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null); // collapse/expand tasks

  const emptyForm: FormState = {
    title: "",
    target: 5,
    type: "daily",
    category: defaultCategory,
    horizon: "short",
    priority: "medium",
    milestones: [],
  };
  const [form, setForm] = useState<FormState>(emptyForm);

  // compute tasks-for-each-goal map once (avoid double work)
  const tasksByGoal = useMemo(() => {
    const map = new Map<string, Task[]>();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const getDayOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const tasksFor = (goal: Goal) => {
      if (!goal) return [] as Task[];
      if (goal.type === "daily") {
        return tasks.filter((task) => {
          const d = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
          const day = getDayOnly(d);
          return (
            day.getTime() === todayStart.getTime() &&
            (task.category || defaultCategory) === (goal.category || defaultCategory) &&
            !!task.completed
          );
        });
      } else {
        return tasks.filter((task) => {
          const d = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
          return (
            d >= startOfWeek &&
            (task.category || defaultCategory) === (goal.category || defaultCategory) &&
            !!task.completed
          );
        });
      }
    };

    goals.forEach((g) => {
      map.set(g.id, tasksFor(g));
    });
    return map;
  }, [goals, tasks, defaultCategory]);

  // category suggestions
  const categorySuggestions = useMemo(() => {
    const s = new Set<string>();
    goals.forEach((g) => s.add(g.category || defaultCategory));
    tasks.forEach((t) => s.add(t.category || defaultCategory));
    return Array.from(s);
  }, [goals, tasks, defaultCategory]);

  // prepare displayed goals with progress (uses tasksByGoal to avoid recompute)
  const displayedGoals = useMemo(() => {
    let list = goals.slice();

    // tab
    if (tab === "short") list = list.filter((g) => (g.horizon || "short") === "short");
    if (tab === "long") list = list.filter((g) => (g.horizon || "short") === "long");

    // search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (g) =>
          (g.title || "").toLowerCase().includes(q) ||
          (g.category || "").toLowerCase().includes(q)
      );
    }

    // filters
    if (categoryFilter) list = list.filter((g) => g.category === categoryFilter);
    if (priorityFilter) list = list.filter((g) => (g.priority || "medium") === priorityFilter);

    // attach progress
    const withProgress = list.map((g) => {
      const current = (tasksByGoal.get(g.id) || []).length;
      const progress = Math.min(Math.round((current / (g.target || 1)) * 100), 100);
      return { goal: g, current, progress };
    });

    // sort
    if (sortBy === "progress") withProgress.sort((a, b) => b.progress - a.progress);
    else if (sortBy === "newest")
      withProgress.sort((a, b) => (Number(b.goal.updatedAt ?? 0) - Number(a.goal.updatedAt ?? 0)));
    else if (sortBy === "oldest")
      withProgress.sort((a, b) => (Number(a.goal.updatedAt ?? 0) - Number(b.goal.updatedAt ?? 0)));
    else if (sortBy === "priority") {
      const score = (p?: any) => (p === "high" ? 3 : p === "medium" ? 2 : 1);
      withProgress.sort((a, b) => score(b.goal.priority) - score(a.goal.priority));
    }

    return withProgress;
  }, [goals, tab, query, categoryFilter, priorityFilter, sortBy, tasksByGoal]);

  // open add
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  // open edit
  const openEdit = (g: Goal) => {
    setEditingId(g.id);
    setForm({
      title: g.title || "",
      target: g.target || 1,
      type: g.type || "daily",
      category: g.category || defaultCategory,
      horizon: (g.horizon as Horizon) || "short",
      priority: (g.priority as Priority) || "medium",
      deadline: g.deadline,
      milestones: (g.milestones || []).map((m) => ({ ...m })),
    });
    setShowModal(true);
  };

  // validate and save
  const handleSave = () => {
    const titleOk = !!form.title.trim();
    const targetOk = Number.isInteger(form.target) && form.target >= 1;
    if (!titleOk) {
      toast.error(t("titleRequired"));
      return;
    }
    if (!targetOk) {
      toast.error(t("targetInvalid"));
      return;
    }

    // payload respects original shape (omit id when adding)
    const payload: Omit<Goal, "id"> = {
      title: form.title.trim(),
      target: form.target,
      // keep current 0 for new/updated here — backend or parent may recalc
      current: 0,
      type: form.type,
      category: form.category,
      horizon: form.horizon,
      priority: form.priority,
      deadline: form.deadline,
      milestones: form.milestones,
      updatedAt: Date.now(),
    } as any;

    if (editingId) {
      onGoalUpdate({ id: editingId, ...(payload as Goal) } as Goal);
      toast.success(t("updated"));
    } else {
      onGoalAdd(payload);
      toast.success(t("saved"));
    }

    setShowModal(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!onGoalDelete) return;
    if (confirm(language === "ar" ? "هل تريد حذف هذا الهدف؟" : "Delete this goal?")) {
      onGoalDelete(id);
      toast.success(t("deleted"));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedGoalId((prev) => (prev === id ? null : id));
  };

  const priorityLabel = (p?: Priority) =>
    p === "high" ? t("priorityHigh") : p === "medium" ? t("priorityMed") : t("priorityLow");

  const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "");

  // Milestone helpers inside modal:
  const addMilestoneToForm = (title: string) => {
    if (!title.trim()) return;
    const newM: Milestone = { id: Date.now().toString(), title: title.trim(), completed: false };
    setForm((prev) => ({ ...prev, milestones: [...prev.milestones, newM] }));
  };

  const toggleMilestoneInForm = (id: string) => {
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)),
    }));
  };

  const updateMilestoneTitleInForm = (id: string, title: string) => {
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) => (m.id === id ? { ...m, title } : m)),
    }));
  };

  const removeMilestoneFromForm = (id: string) => {
    setForm((prev) => ({ ...prev, milestones: prev.milestones.filter((m) => m.id !== id) }));
  };

  return (
    <div
      className="max-w-4xl mx-auto px-4 py-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 leading-relaxed"
      dir={dir}
    >
      <Toaster position="top-right" />

      {/* header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-semibold">{language === "ar" ? "الأهداف" : "Goals"}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {language === "ar" ? "تابع أهدافك قصيرة وطويلة المدى" : "Track short & long term goals"}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className={`absolute top-2 ${dir === "rtl" ? "right-3" : "left-3"} w-4 h-4 text-gray-400`} />
            <input
              aria-label={t("searchPlaceholder")}
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-md bg-white dark:bg-gray-800"
            />
          </div>

          <button onClick={openAdd} className="ml-2 inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("addGoal")}</span>
          </button>
        </div>
      </div>

      {/* tabs & filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={tab === "all"}
            onClick={() => setTab("all")}
            className={`px-3 py-1 rounded ${tab === "all" ? "bg-gray-800 text-white" : "bg-gray-100 dark:bg-gray-700"}`}
          >
            {t("all")}
          </button>
          <button
            type="button"
            aria-pressed={tab === "short"}
            onClick={() => setTab("short")}
            className={`px-3 py-1 rounded ${tab === "short" ? "bg-gray-800 text-white" : "bg-gray-100 dark:bg-gray-700"}`}
          >
            {t("short")}
          </button>
          <button
            type="button"
            aria-pressed={tab === "long"}
            onClick={() => setTab("long")}
            className={`px-3 py-1 rounded ${tab === "long" ? "bg-gray-800 text-white" : "bg-gray-100 dark:bg-gray-700"}`}
          >
            {t("long")}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="p-2 border rounded bg-white dark:bg-gray-800">
            <option value="progress">{language === "ar" ? "الأكثر تقدمًا" : "Top progress"}</option>
            <option value="newest">{language === "ar" ? "الأحدث" : "Newest"}</option>
            <option value="oldest">{language === "ar" ? "الأقدم" : "Oldest"}</option>
            <option value="priority">{language === "ar" ? "الأولوية" : "Priority"}</option>
          </select>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="p-2 border rounded bg-white dark:bg-gray-800">
            <option value="">{t("categoryLabel")}</option>
            {categorySuggestions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="p-2 border rounded bg-white dark:bg-gray-800">
            <option value="">{t("priorityLabel")}</option>
            <option value="high">{t("priorityHigh")}</option>
            <option value="medium">{t("priorityMed")}</option>
            <option value="low">{t("priorityLow")}</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategoryFilter("");
              setPriorityFilter("");
              setSortBy("progress");
            }}
            className="p-2 border rounded bg-white dark:bg-gray-800"
            title={t("viewTasks")}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedGoals.length === 0 ? (
          <div className="col-span-full p-6 text-center border rounded bg-white dark:bg-gray-800">
            <Target className="mx-auto w-12 h-12 text-gray-300 mb-3" />
            <div className="text-lg font-medium">{t("noGoals")}</div>
          </div>
        ) : (
          displayedGoals.map(({ goal, current, progress }) => {
            const completed = progress >= 100;
            const contributingTasks = tasksByGoal.get(goal.id) || [];
            return (
              <article key={goal.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm flex flex-col justify-between">
                <header className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      <h3 className="font-semibold text-lg">{goal.title}</h3>
                      <span
                        className={`ml-2 text-xs px-2 py-0.5 rounded-full ${completed ? "bg-green-100 text-green-700" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
                      >
                        {completed
                          ? language === "ar"
                            ? "منجز"
                            : "Achieved"
                          : goal.horizon === "long"
                          ? language === "ar"
                            ? "طويل الأمد"
                            : "Long"
                          : language === "ar"
                          ? "قصير الأمد"
                          : "Short"}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{goal.category}</div>

                    <div className="mt-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded overflow-hidden">
                        <div
                          style={{ width: `${progress}%` }}
                          className={`h-3 ${progress >= 100 ? "bg-green-400" : progress >= 75 ? "bg-blue-400" : progress >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                        />
                      </div>

                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">
                        <div>
                          {current}/{goal.target} • {progress}%
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{priorityLabel(goal.priority)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {current}/{goal.target}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{goal.deadline ? fmtDate(goal.deadline) : ""}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(goal)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title={language === "ar" ? "تعديل" : "Edit"}>
                        <Edit className="w-4 h-4" />
                      </button>
                      {onGoalDelete && (
                        <button onClick={() => handleDelete(goal.id)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600" title={t("delete")}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => toggleExpand(goal.id)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title={t("viewTasks")}>
                        <List className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Export / share">
                        <Award className="w-4 h-4 text-yellow-500" />
                      </button>
                    </div>
                  </div>
                </header>

                {/* expandable tasks */}
                {expandedGoalId === goal.id && (
                  <div className="mt-3 border-t pt-3">
                    <h4 className="text-sm font-medium mb-2">{t("viewTasks")}</h4>
                    <ul className="space-y-2">
                      {contributingTasks.length === 0 ? (
                        <li className="text-sm text-gray-500 dark:text-gray-400">{language === "ar" ? "لا توجد مهام مساهمة" : "No contributing tasks"}</li>
                      ) : (
                        contributingTasks.map((task) => (
                          <li key={task.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div>
                              <div className="font-medium">{task.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {task.dueDate ? new Date(task.dueDate).toLocaleString() : new Date(task.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {task.completed ? (language === "ar" ? "مكتملة" : "Done") : language === "ar" ? "قيد الإنجاز" : "In progress"}
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* modal */}
      {showModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingId ? t("editGoal") : t("addGoal")}</h3>
              <button onClick={() => { setShowModal(false); setEditingId(null); setForm(emptyForm); }} aria-label={t("cancel")} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">{t("categoryLabel")}</label>
                <input list="cats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-700" />
                <datalist id="cats">{categorySuggestions.map((c) => <option key={c} value={c} />)}</datalist>
              </div>

              <div>
                <label className="block text-sm font-medium">{language === "ar" ? "عنوان الهدف" : "Title"}</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-700" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">{t("targetLabel")}</label>
                  <input
                    type="number"
                    min={1}
                    value={form.target}
                    onChange={(e) => setForm({ ...form, target: Math.max(1, parseInt(e.target.value || "1", 10)) })}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">{t("typeLabel")}</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full p-2 border rounded bg-white dark:bg-gray-700">
                    <option value="daily">{language === "ar" ? "يومي" : "Daily"}</option>
                    <option value="weekly">{language === "ar" ? "أسبوعي" : "Weekly"}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">{t("horizon")}</label>
                  <select value={form.horizon} onChange={(e) => setForm({ ...form, horizon: e.target.value as Horizon })} className="w-full p-2 border rounded bg-white dark:bg-gray-700">
                    <option value="short">{t("short")}</option>
                    <option value="long">{t("long")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">{t("priorityLabel")}</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className="w-full p-2 border rounded bg-white dark:bg-gray-700">
                    <option value="low">{t("priorityLow")}</option>
                    <option value="medium">{t("priorityMed")}</option>
                    <option value="high">{t("priorityHigh")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">{t("deadline")}</label>
                <input type="date" value={form.deadline || ""} onChange={(e) => setForm({ ...form, deadline: e.target.value || undefined })} className="w-full p-2 border rounded bg-white dark:bg-gray-700" />
              </div>

              {/* Milestones editor */}
              <div>
                <label className="block text-sm font-medium">{t("milestones")}</label>
                <div className="mt-2 space-y-2">
                  {form.milestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={!!m.completed} onChange={() => toggleMilestoneInForm(m.id)} className="h-4 w-4" />
                      <input
                        value={m.title}
                        onChange={(e) => updateMilestoneTitleInForm(m.id, e.target.value)}
                        className="flex-1 p-2 border rounded bg-white dark:bg-gray-700"
                      />
                      <button onClick={() => removeMilestoneFromForm(m.id)} className="text-red-600 px-2 py-1 rounded border">
                        {t("delete")}
                      </button>
                    </div>
                  ))}

                  <AddMilestoneRow onAdd={(title) => addMilestoneToForm(title)} language={language} />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">{t("save")}</button>
              <button onClick={() => { setShowModal(false); setEditingId(null); setForm(emptyForm); }} className="px-4 py-2 rounded border">{t("cancel")}</button>
              {editingId && onGoalDelete && (
                <button onClick={() => handleDelete(editingId)} className="ml-auto text-red-600 px-3 py-2 rounded border">
                  {t("delete")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;

/* ---------- helper subcomponent for adding milestone row ---------- */
function AddMilestoneRow({ onAdd, language }: { onAdd: (title: string) => void; language: "ar" | "en" }) {
  const [value, setValue] = useState("");
  const placeholder = language === "ar" ? "عنوان المعلم" : "Milestone title";
  return (
    <div className="flex gap-2">
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="flex-1 p-2 border rounded bg-white dark:bg-gray-700" />
      <button
        onClick={() => {
          if (!value.trim()) return;
          onAdd(value);
          setValue("");
        }}
        className="px-3 py-2 rounded bg-green-600 text-white"
      >
        {language === "ar" ? "أضف" : "Add"}
      </button>
    </div>
  );
}
