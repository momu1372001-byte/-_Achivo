import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, CheckCircle, Bell, X } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  purpose: string;
  startDate: string;
  endDate: string;
  notifyTime?: string;
  progress: number; // نسبة الإنجاز %
  completedDays: string[]; // الأيام اللي تم فيها وضع علامة ✅
}

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [form, setForm] = useState({
    title: "",
    purpose: "",
    startDate: "",
    endDate: "",
    notifyTime: "",
  });

  // حساب التقدّم لكل هدف
  const calculateProgress = (goal: Goal) => {
    const start = new Date(goal.startDate);
    const end = new Date(goal.endDate);
    const totalDays =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return Math.min(
      Math.round((goal.completedDays.length / totalDays) * 100),
      100
    );
  };

  // إضافة أو تحديث هدف
  const handleSave = () => {
    if (!form.title || !form.startDate || !form.endDate) return;

    if (editingGoal) {
      const updated: Goal = {
        ...editingGoal,
        ...form,
        progress: calculateProgress(editingGoal),
      };
      setGoals((prev) =>
        prev.map((g) => (g.id === editingGoal.id ? updated : g))
      );
    } else {
      const newGoal: Goal = {
        id: Date.now().toString(),
        title: form.title,
        purpose: form.purpose,
        startDate: form.startDate,
        endDate: form.endDate,
        notifyTime: form.notifyTime,
        progress: 0,
        completedDays: [],
      };
      setGoals([...goals, newGoal]);
    }

    setForm({ title: "", purpose: "", startDate: "", endDate: "", notifyTime: "" });
    setEditingGoal(null);
    setShowForm(false);
  };

  // حذف هدف
  const handleDelete = (id: string) => {
    if (confirm("هل تريد حذف هذا الهدف؟")) {
      setGoals(goals.filter((g) => g.id !== id));
    }
  };

  // تعديل هدف
  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      purpose: goal.purpose,
      startDate: goal.startDate,
      endDate: goal.endDate,
      notifyTime: goal.notifyTime || "",
    });
    setShowForm(true);
  };

  // ✅ إنجاز يوم واحد فقط
  const markDayComplete = (goal: Goal) => {
    const today = new Date().toISOString().split("T")[0];
    if (goal.completedDays.includes(today)) {
      alert("لقد سجلت إنجاز هذا الهدف اليوم بالفعل ✅");
      return;
    }
    const updated = {
      ...goal,
      completedDays: [...goal.completedDays, today],
    };
    updated.progress = calculateProgress(updated);
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? updated : g)));
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* زر إضافة هدف */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">🎯 أهدافي</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded"
        >
          <Plus className="w-4 h-4" /> إضافة هدف
        </button>
      </div>

      {/* قائمة الأهداف */}
      {goals.length === 0 && <p className="text-gray-500">لا توجد أهداف بعد</p>}
      <div className="space-y-3">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="p-4 rounded shadow bg-white dark:bg-gray-800"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{goal.title}</h3>
                <p className="text-sm text-gray-600">{goal.purpose}</p>
                <p className="text-xs text-gray-500">
                  {goal.startDate} → {goal.endDate}
                </p>
                {goal.notifyTime && (
                  <p className="text-xs flex items-center gap-1 text-gray-500">
                    <Bell className="w-4 h-4" /> تنبيه: {goal.notifyTime}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(goal)}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="تعديل"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="p-2 hover:bg-gray-100 rounded text-red-600"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => markDayComplete(goal)}
                  className="p-2 hover:bg-gray-100 rounded text-green-600"
                  title="إنجاز اليوم"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="mt-3">
              <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  style={{ width: `${goal.progress}%` }}
                  className="h-2 bg-blue-500"
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{goal.progress}%</p>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة إضافة/تعديل */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingGoal ? "تعديل الهدف" : "إضافة هدف"}
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                placeholder="اسم الهدف"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <textarea
                placeholder="الغرض من الهدف"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="flex-1 p-2 border rounded"
                />
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  className="flex-1 p-2 border rounded"
                />
              </div>
              <div>
                <label className="text-sm">وقت التنبيه (اختياري)</label>
                <input
                  type="time"
                  value={form.notifyTime}
                  onChange={(e) =>
                    setForm({ ...form, notifyTime: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-blue-600 text-white rounded"
              >
                {editingGoal ? "حفظ التغييرات" : "إضافة"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 bg-gray-400 text-white rounded"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
