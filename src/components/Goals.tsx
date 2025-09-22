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
  const [tab, setTab] = useState<"all" | Horizon | "long">("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"progress" | "newest" | "oldest" | "priority">("progress");
  const [categoryFilter, setCategoryFilter] = useState<string | "">("");
  const [priorityFilter, setPriorityFilter] = useState<string | "">("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  // --- helpers ---
  const tasksForGoal = useCallback(
    (goal: Goal) => {
      const now = new Date();
      if (goal.type === "daily") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return tasks.filter((task) => {
          const d = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
          const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          return (
            day.getTime() === today.getTime() &&
            (task.category || defaultCategory) === (goal.category || defaultCategory) &&
            !!task.completed
          );
        });
      } else {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return tasks.filter((task) => {
          const d = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
          return (
            d >= startOfWeek &&
            (task.category || defaultCategory) === (goal.category || defaultCategory) &&
            !!task.completed
          );
        });
      }
    },
    [tasks, defaultCategory]
  );

  const categorySuggestions = useMemo(() => {
    const s = new Set<string>();
    goals.forEach((g) => s.add(g.category || defaultCategory));
    tasks.forEach((t) => s.add(t.category || defaultCategory));
    return Array.from(s);
  }, [goals, tasks, defaultCategory]);

  const displayedGoals = useMemo(() => {
    let list = goals.slice();

    if (tab === "short") list = list.filter((g) => (g.horizon || "short") === "short");
    if (tab === "long") list = list.filter((g) => (g.horizon || "short") === "long");

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (g) =>
          (g.title || "").toLowerCase().includes(q) ||
          (g.category || "").toLowerCase().includes(q)
      );
    }

    if (categoryFilter) list = list.filter((g) => g.category === categoryFilter);
    if (priorityFilter) list = list.filter((g) => (g.priority || "medium") === priorityFilter);

    const withProgress = list.map((g) => {
      const current = tasksForGoal(g).length;
      const progress = Math.min(Math.round((current / (g.target || 1)) * 100), 100);
      return { goal: g, current, progress };
    });

    if (sortBy === "progress") withProgress.sort((a, b) => b.progress - a.progress);
    else if (sortBy === "newest") withProgress.sort((a, b) => (b.goal.updatedAt || 0) - (a.goal.updatedAt || 0));
    else if (sortBy === "oldest") withProgress.sort((a, b) => (a.goal.updatedAt || 0) - (b.goal.updatedAt || 0));
    else if (sortBy === "priority") {
      const score = (p?: Priority) => (p === "high" ? 3 : p === "medium" ? 2 : 1);
      withProgress.sort((a, b) => score(b.goal.priority) - score(a.goal.priority));
    }

    return withProgress;
  }, [goals, tab, query, categoryFilter, priorityFilter, sortBy, tasksForGoal]);

  // form actions
  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

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

  const handleSave = () => {
    const titleOk = !!form.title.trim();
    const targetOk = Number.isInteger(form.target) && form.target >= 1;
    if (!titleOk || !targetOk) return; // keep simple: skip save if invalid

    const payload: Omit<Goal, "id"> = {
      title: form.title.trim(),
      target: form.target,
      current: 0,
      type: form.type,
      category: form.category,
      horizon: form.horizon,
      priority: form.priority,
      deadline: form.deadline,
      milestones: form.milestones,
      updatedAt: Date.now(),
    };

    if (editingId) {
      onGoalUpdate({ id: editingId, ...(payload as Goal) } as Goal);
    } else {
      onGoalAdd(payload);
    }

    setShowModal(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!onGoalDelete) return;
    if (confirm(language === "ar" ? "هل تريد حذف هذا الهدف؟" : "Delete this goal?")) {
      onGoalDelete(id);
    }
  };

  const priorityLabel = (p?: Priority) =>
    p === "high" ? t("priorityHigh") : p === "medium" ? t("priorityMed") : t("priorityLow");

  // small date formatter
  const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" dir={dir}>
      {/* header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-semibold">{language === "ar" ? "الأهداف" : "Goals"}</h2>
          <p className="text-sm text-gray-600">{language === "ar" ? "تابع أهدافك قصيرة وطويلة المدى" : "Track short & long term goals"}</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className={`absolute top-2 ${dir === "rtl" ? "right-3" : "left-3"} w-4 h-4 text-gray-400`} />
            <input
              aria-label={t("searchPlaceholder")}
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-md"
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
          <button onClick={() => setTab("all")} className={`px-3 py-1 rounded ${tab === "all" ? "bg-gray-800 text-white" : "bg-gray-100"}`}>{t("all")}</button>
          <button onClick={() => setTab("short")} className={`px-3 py-1 rounded ${tab === "short" ? "bg-gray-800 text-white" : "bg-gray-100"}`}>{t("short")}</button>
          <button onClick={() => setTab("long")} className={`px-3 py-1 rounded ${tab === "long" ? "bg-gray-800 text-white" : "bg-gray-100"}`}>{t("long")}</button>
        </div>

        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="p-2 border rounded">
            <option value="progress">{language === "ar" ? "الأكثر تقدمًا" : "Top progress"}</option>
            <option value="newest">{language === "ar" ? "الأحدث" : "Newest"}</option>
            <option value="oldest">{language === "ar" ? "الأقدم" : "Oldest"}</option>
            <option value="priority">{language === "ar" ? "الأولوية" : "Priority"}</option>
          </select>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="p-2 border rounded">
            <option value="">{t("categoryLabel")}</option>
            {categorySuggestions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="p-2 border rounded">
            <option value="">{t("priority")}</option>
            <option value="high">{t("priorityHigh")}</option>
            <option value="medium">{t("priorityMed")}</option>
            <option value="low">{t("priorityLow")}</option>
          </select>

          <button onClick={() => { setQuery(""); setCategoryFilter(""); setPriorityFilter(""); setSortBy("progress"); }} className="p-2 border rounded">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedGoals.length === 0 ? (
          <div className="col-span-full p-6 text-center border rounded">
            <Target className="mx-auto w-12 h-12 text-gray-300 mb-3" />
            <div className="text-lg font-medium">{t("noGoals")}</div>
          </div>
        ) : (
          displayedGoals.map(({ goal, current, progress }) => {
            const completed = progress >= 100;
            return (
              <article key={goal.id} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col justify-between">
                <header className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      <h3 className="font-semibold text-lg">{goal.title}</h3>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {completed ? (language === "ar" ? "منجز" : "Achieved") : goal.horizon === "long" ? (language === "ar" ? "طويل الأمد" : "Long") : (language === "ar" ? "قصير الأمد" : "Short")}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">{goal.category}</div>

                    <div className="mt-3">
                      <div className="w-full bg-gray-200 h-3 rounded overflow-hidden">
                        <div style={{ width: `${progress}%` }} className={`h-3 ${progress >= 100 ? "bg-green-400" : progress >= 75 ? "bg-blue-400" : progress >= 50 ? "bg-yellow-400" : "bg-red-400"}`}></div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600 flex items-center justify-between">
                        <div>{current}/{goal.target} • {progress}%</div>
                        <div className="text-xs text-gray-400">{priorityLabel(goal.priority)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-xl font-bold">{current}/{goal.target}</div>
                      <div className="text-sm text-gray-500">{goal.deadline ? fmtDate(goal.deadline) : ""}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(goal)} className="p-2 rounded hover:bg-gray-100"><Edit className="w-4 h-4" /></button>
                      {onGoalDelete && <button onClick={() => handleDelete(goal.id)} className="p-2 rounded hover:bg-gray-100 text-red-600"><Trash2 className="w-4 h-4" /></button>}
                      <button className="p-2 rounded hover:bg-gray-100"><List className="w-4 h-4" /></button>
                    </div>
                  </div>
                </header>
              </article>
            );
          })
        )}
      </div>

      {/* modal */}
      {showModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg w-full max-w-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingId ? t("editGoal") : t("addGoal")}</h3>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} aria-label={t("cancel")} className="p-1"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">{t("categoryLabel")}</label>
                <input list="cats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full p-2 border rounded" />
                <datalist id="cats">{categorySuggestions.map((c) => <option key={c} value={c} />)}</datalist>
              </div>

              <div>
                <label className="block text-sm font-medium">{language === "ar" ? "عنوان الهدف" : "Title"}</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full p-2 border rounded" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">{t("targetLabel")}</label>
                  <input type="number" min={1} value={form.target} onChange={(e) => setForm({ ...form, target: Math.max(1, parseInt(e.target || "1")) })} className="w-full p-2 border rounded" />
                </div>

                <div>
                  <label className="block text-sm font-medium">{t("typeLabel")}</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full p-2 border rounded">
                    <option value="daily">{language === "ar" ? "يومي" : "Daily"}</option>
                    <option value="weekly">{language === "ar" ? "أسبوعي" : "Weekly"}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">{t("horizon")}</label>
                  <select value={form.horizon} onChange={(e) => setForm({ ...form, horizon: e.target.value as Horizon })} className="w-full p-2 border rounded">
                    <option value="short">{t("short")}</option>
                    <option value="long">{t("long")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">{t("priority")}</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className="w-full p-2 border rounded">
                    <option value="low">{t("priorityLow")}</option>
                    <option value="medium">{t("priorityMed")}</option>
                    <option value="high">{t("priorityHigh")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">{t("deadline")}</label>
                <input type="date" value={form.deadline || ""} onChange={(e) => setForm({ ...form, deadline: e.target.value || undefined })} className="w-full p-2 border rounded" />
              </div>

            </div>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">{t("save")}</button>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="px-4 py-2 rounded border">{t("cancel")}</button>
              {editingId && onGoalDelete && <button onClick={() => handleDelete(editingId)} className="ml-auto text-red-600 px-3 py-2 rounded border">{t("delete")}</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
