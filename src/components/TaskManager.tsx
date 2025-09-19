// src/components/TaskManager.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Clock,
  Calendar,
  Flag,
  CheckCircle,
  Trash2,
  Play,
  Pause,
  Edit3,
} from "lucide-react";
import { Task, Category } from "../types";

interface TaskManagerProps {
  tasks: Task[];
  categories: Category[];
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskAdd: (task: Omit<Task, "id">) => void;
  taskView?: "list" | "grid";
  minimalView?: boolean;
  language?: "ar" | "en";
}

const dateToInput = (d?: Date | string) => {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  // keep local YYYY-MM-DD
  return date.toISOString().split("T")[0];
};

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  categories,
  onTaskUpdate,
  onTaskDelete,
  onTaskAdd,
  taskView = "list",
  minimalView = false,
  language = "ar",
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [taskBeingEdited, setTaskBeingEdited] = useState<Task | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const defaultCategory =
    categories.length > 0 ? categories[0].name : language === "ar" ? "عام" : "General";

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    category: defaultCategory,
    // keep dueDate as string for input; convert to Date when creating payload
    dueDate: "",
  });

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // Keep newTask.category in sync when categories change
  useEffect(() => {
    if (categories.length === 0) return;
    setNewTask((prev) => {
      // if current category is not in categories, set to first
      if (!categories.find((c) => c.name === prev.category)) {
        return { ...prev, category: categories[0].name };
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesCategory = filterCategory === "all" || task.category === filterCategory;

    return matchesSearch && matchesPriority && matchesCategory;
  });

  const handleAddTask = () => {
    const title = newTask.title.trim();
    if (!title) {
      alert(language === "ar" ? "الرجاء إدخال عنوان المهمة." : "Please enter a task title.");
      titleInputRef.current?.focus();
      return;
    }

    const payload: Omit<Task, "id"> = {
      title,
      description: newTask.description?.trim() || "",
      status: "todo",
      priority: newTask.priority,
      category: newTask.category || defaultCategory,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      createdAt: new Date(),
      timeSpent: 0,
    };

    onTaskAdd(payload);

    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      category: defaultCategory,
      dueDate: "",
    });
    setShowAddForm(false);

    setTimeout(() => titleInputRef.current?.focus(), 200);
  };

  const handleEditTask = () => {
    if (!taskBeingEdited) return;

    // Build updated task — ensure dueDate is Date | undefined
    const updatedTask: Task = {
      ...taskBeingEdited,
      title: taskBeingEdited.title.trim(),
      description: taskBeingEdited.description?.trim() || "",
      priority: taskBeingEdited.priority,
      category: taskBeingEdited.category,
      dueDate:
        taskBeingEdited.dueDate && typeof taskBeingEdited.dueDate === "string"
          ? new Date(taskBeingEdited.dueDate)
          : (taskBeingEdited.dueDate as Date | undefined),
    };

    onTaskUpdate(updatedTask);
    setTaskBeingEdited(null);
    setShowEditForm(false);
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus =
      task.status === "todo" ? "in-progress" : task.status === "in-progress" ? "done" : "todo";
    onTaskUpdate({ ...task, status: newStatus });
  };

  const toggleTimer = (taskId: string) => {
    if (activeTimer === taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        const minutesToAdd = Math.floor(timerSeconds / 60);
        onTaskUpdate({ ...task, timeSpent: (task.timeSpent || 0) + minutesToAdd });
      }
      setActiveTimer(null);
      setTimerSeconds(0);
    } else {
      setActiveTimer(taskId);
      setTimerSeconds(0);
    }
  };

  useEffect(() => {
    let intervalId: number | undefined;
    if (activeTimer) {
      intervalId = window.setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [activeTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-gray-100">
            {language === "ar" ? "إدارة المهام" : "Task Manager"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {language === "ar" ? "نظم مهامك وتابع تقدمك" : "Organize your tasks and track progress"}
          </p>
        </div>

        {/* زر إضافة المهمة */}
        <button
          type="button"
          onClick={() => {
            setShowAddForm(true);
            setTimeout(() => titleInputRef.current?.focus(), 100);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg transition duration-200 rtl:space-x-reverse"
        >
          <Plus className="w-5 h-5" />
          <span>{language === "ar" ? "إضافة مهمة جديدة" : "Add New Task"}</span>
        </button>
      </div>

      {/* الفلاتر */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={language === "ar" ? "البحث في المهام..." : "Search tasks..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="all">{language === "ar" ? "جميع الأولويات" : "All priorities"}</option>
            <option value="high">{language === "ar" ? "أولوية عالية" : "High"}</option>
            <option value="medium">{language === "ar" ? "أولوية متوسطة" : "Medium"}</option>
            <option value="low">{language === "ar" ? "أولوية منخفضة" : "Low"}</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="all">{language === "ar" ? "جميع الفئات" : "All categories"}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* نموذج إضافة المهمة (Modal) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {language === "ar" ? "إضافة مهمة جديدة" : "Add New Task"}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTask();
              }}
              className="space-y-4"
            >
              <input
                ref={titleInputRef}
                type="text"
                placeholder={language === "ar" ? "عنوان المهمة" : "Task title"}
                value={newTask.title}
                onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                required
              />

              <textarea
                placeholder={language === "ar" ? "وصف المهمة (اختياري)" : "Task description (optional)"}
                value={newTask.description}
                onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100"
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value as any }))}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="low">{language === "ar" ? "أولوية منخفضة" : "Low"}</option>
                  <option value="medium">{language === "ar" ? "أولوية متوسطة" : "Medium"}</option>
                  <option value="high">{language === "ar" ? "أولوية عالية" : "High"}</option>
                </select>

                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, category: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100"
                >
                  {categories.length === 0 && <option value="عام">{language === "ar" ? "عام" : "General"}</option>}
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100"
              />

              <div className="flex gap-3 mt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium">
                  {language === "ar" ? "إضافة المهمة" : "Add Task"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTask({
                      title: "",
                      description: "",
                      priority: "medium",
                      category: defaultCategory,
                      dueDate: "",
                    });
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 py-2 rounded-lg"
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* عرض المهام */}
      <div className={`grid gap-4 ${taskView === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
        {filteredTasks.map((task) => (
          <div key={task.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md ${task.status === "done" ? "opacity-75" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleTaskStatus(task)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    task.status === "done"
                      ? "bg-green-500 border-green-500 text-white"
                      : task.status === "in-progress"
                      ? "bg-yellow-500 border-yellow-500 text-white"
                      : "border-gray-300 hover:border-green-400"
                  }`}
                >
                  {task.status === "done" && <CheckCircle className="w-4 h-4" />}
                </button>

                <div className="flex-1">
                  <h3 className={`font-semibold ${task.status === "done" ? "line-through text-gray-500" : "text-gray-900 dark:text-gray-100"}`}>
                    {task.title}
                  </h3>

                  {!minimalView && (
                    <>
                      {task.description && <p className="text-gray-600 dark:text-gray-300 mt-1">{task.description}</p>}

                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${task.priority === "high" ? "bg-red-100 text-red-700" : task.priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                          <Flag className="w-3 h-3 inline mr-1" />
                          {task.priority === "high" ? (language === "ar" ? "عالية" : "High") : task.priority === "medium" ? (language === "ar" ? "متوسطة" : "Medium") : (language === "ar" ? "منخفضة" : "Low")}
                        </span>

                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{task.category}</span>

                        {task.dueDate && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                          </span>
                        )}

                        {task.timeSpent && task.timeSpent > 0 && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {Math.floor(task.timeSpent / 60)}{language === "ar" ? "س " : "h "}{task.timeSpent % 60}{language === "ar" ? "د" : "m"}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!minimalView && (
                  <div className="flex items-center gap-2">
                    {activeTimer === task.id && <span className="text-sm font-mono text-blue-600">{formatTime(timerSeconds)}</span>}
                    <button onClick={() => toggleTimer(task.id)} className={`p-2 rounded-lg transition-colors duration-200 ${activeTimer === task.id ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`}>
                      {activeTimer === task.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    setTaskBeingEdited(task);
                    setShowEditForm(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button onClick={() => onTaskDelete(task.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 col-span-full">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{language === "ar" ? "لا توجد مهام" : "No tasks"}</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchTerm || filterPriority !== "all" || filterCategory !== "all"
                ? language === "ar"
                  ? "لا توجد مهام تطابق البحث المحدد"
                  : "No tasks match the current filters"
                : language === "ar"
                ? "ابدأ بإضافة مهامك الأولى"
                : "Start by adding your first tasks"}
            </p>
          </div>
        )}
      </div>

      {/* نافذة تعديل المهمة */}
      {showEditForm && taskBeingEdited && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{language === "ar" ? "تعديل المهمة" : "Edit Task"}</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditTask();
              }}
              className="space-y-4"
            >
              <input
                type="text"
                value={taskBeingEdited.title}
                onChange={(e) =>
                  setTaskBeingEdited((prev) => (prev ? { ...prev, title: e.target.value } : prev))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100"
                required
              />

              <textarea
                value={taskBeingEdited.description ?? ""}
                onChange={(e) =>
                  setTaskBeingEdited((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100"
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={taskBeingEdited.priority}
                  onChange={(e) =>
                    setTaskBeingEdited((prev) => (prev ? { ...prev, priority: e.target.value as any } : prev))
                  }
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="low">{language === "ar" ? "أولوية منخفضة" : "Low"}</option>
                  <option value="medium">{language === "ar" ? "أولوية متوسطة" : "Medium"}</option>
                  <option value="high">{language === "ar" ? "أولوية عالية" : "High"}</option>
                </select>

                <select
                  value={taskBeingEdited.category}
                  onChange={(e) => setTaskBeingEdited((prev) => (prev ? { ...prev, category: e.target.value } : prev))}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="date"
                value={dateToInput(taskBeingEdited.dueDate)}
                onChange={(e) =>
                  setTaskBeingEdited((prev) => (prev ? { ...prev, dueDate: e.target.value ? e.target.value : undefined } : prev))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-gray-100"
              />

              <div className="flex gap-3 mt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium">
                  {language === "ar" ? "حفظ التعديلات" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setTaskBeingEdited(null);
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 py-2 rounded-lg"
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
