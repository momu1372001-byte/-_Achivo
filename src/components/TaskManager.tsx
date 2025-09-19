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
    categories.length > 0
      ? categories[0].name
      : language === "ar"
      ? "عام"
      : "General";

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    category: defaultCategory,
    dueDate: "",
  });

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (
      !categories.find((c) => c.name === newTask.category) &&
      categories.length > 0
    ) {
      setNewTask((prev) => ({ ...prev, category: categories[0].name }));
    }
    if (
      !showAddForm &&
      categories.length > 0 &&
      newTask.category !== categories[0].name
    ) {
      setNewTask((prev) => ({ ...prev, category: categories[0].name }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority =
      filterPriority === "all" || task.priority === filterPriority;
    const matchesCategory =
      filterCategory === "all" || task.category === filterCategory;

    return matchesSearch && matchesPriority && matchesCategory;
  });

  const handleAddTask = () => {
    const title = newTask.title.trim();
    if (!title) {
      alert(
        language === "ar"
          ? "الرجاء إدخال عنوان المهمة."
          : "Please enter a task title."
      );
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

    const updatedTask: Task = {
      ...taskBeingEdited,
      title: taskBeingEdited.title.trim(),
      description: taskBeingEdited.description?.trim() || "",
      priority: taskBeingEdited.priority,
      category: taskBeingEdited.category,
      dueDate: taskBeingEdited.dueDate
        ? new Date(taskBeingEdited.dueDate)
        : undefined,
    };

    onTaskUpdate(updatedTask);
    setTaskBeingEdited(null);
    setShowEditForm(false);
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus =
      task.status === "todo"
        ? "in-progress"
        : task.status === "in-progress"
        ? "done"
        : "todo";
    onTaskUpdate({ ...task, status: newStatus });
  };

  const toggleTimer = (taskId: string) => {
    if (activeTimer === taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        const minutesToAdd = Math.floor(timerSeconds / 60);
        onTaskUpdate({
          ...task,
          timeSpent: (task.timeSpent || 0) + minutesToAdd,
        });
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
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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
            {language === "ar"
              ? "نظم مهامك وتابع تقدمك"
              : "Organize your tasks and track progress"}
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
          <span>
            {language === "ar" ? "إضافة مهمة جديدة" : "Add New Task"}
          </span>
        </button>
      </div>

      {/* ... (نفس الفلاتر وإضافة المهمة) ... */}

      {/* عرض المهام */}
      <div
        className={`grid gap-4 ${
          taskView === "grid"
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md ${
              task.status === "done" ? "opacity-75" : ""
            }`}
          >
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
                  {task.status === "done" && (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </button>

                <div className="flex-1">
                  <h3
                    className={`font-semibold ${
                      task.status === "done"
                        ? "line-through text-gray-500"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {task.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTaskBeingEdited(task);
                    setShowEditForm(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onTaskDelete(task.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة تعديل المهمة */}
      {showEditForm && taskBeingEdited && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {language === "ar" ? "تعديل المهمة" : "Edit Task"}
            </h3>
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
                  setTaskBeingEdited({
                    ...taskBeingEdited,
                    title: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100"
                required
              />

              <textarea
                value={taskBeingEdited.description}
                onChange={(e) =>
                  setTaskBeingEdited({
                    ...taskBeingEdited,
                    description: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100"
              />

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
                >
                  {language === "ar" ? "حفظ" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
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
