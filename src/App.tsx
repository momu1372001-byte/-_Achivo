// src/App.tsx
import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { TaskManager } from "./components/TaskManager";
import { Calendar } from "./components/Calendar";
import { Goals } from "./components/Goals";
import { Task, Category, Goal } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import {
  initialCategories,
  initialTasks,
  initialGoals,
} from "./data/initialData";
import BottomBar from "./components/BottomBar";

type ActiveModal = "settings" | "security" | "ai" | null;

function App() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "tasks" | "calendar" | "goals"
  >("dashboard");

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // ---------- إعدادات عامة ----------
  const [darkMode, setDarkMode] = useLocalStorage("settings-darkMode", false);
  const [themeColor, setThemeColor] = useLocalStorage("settings-theme-color", "blue");
  const [fontSize, setFontSize] = useLocalStorage("settings-font-size", "normal");
  const [taskView, setTaskView] = useLocalStorage("settings-task-view", "list");
  const [reminderTone, setReminderTone] = useLocalStorage("settings-reminder-tone", "default");
  const [minimalView, setMinimalView] = useLocalStorage("settings-minimal-view", false);

  // ---------- تأمين التطبيق ----------
  const [appPassword, setAppPassword] = useLocalStorage<string | null>("settings-app-password", null);
  const [appLockedSession, setAppLockedSession] = useState(false);

  useEffect(() => {
    if (appPassword) setAppLockedSession(true);
    else setAppLockedSession(false);
  }, [appPassword]);

  // ---------- تفعيل الثيم ----------
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-color", themeColor);
  }, [themeColor]);

  // ---------- بيانات ----------
  const [tasks, setTasks] = useLocalStorage<Task[]>("productivity-tasks", initialTasks);
  const [categories, setCategories] = useLocalStorage<Category[]>("productivity-categories", initialCategories);
  const [goals, setGoals] = useLocalStorage<Goal[]>("productivity-goals", initialGoals);

  // ---------- إدارة المهام ----------
  const handleTaskAdd = (newTask: Omit<Task, "id">) => {
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks((prev) => [...prev, task]);
  };
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };
  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // ---------- إدارة الأهداف ----------
  const handleGoalAdd = (newGoal: Omit<Goal, "id">) => {
    const goal: Goal = { ...newGoal, id: Date.now().toString() };
    setGoals((prev) => [...prev, goal]);
  };
  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  };

  // ---------- شاشة القفل ----------
  if (appLockedSession && appPassword) {
    return (
      <LockScreen
        savedPassword={appPassword}
        onUnlock={() => setAppLockedSession(false)}
      />
    );
  }

  // ---------- التبويب ----------
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard tasks={tasks} goals={goals} />;
      case "tasks":
        return (
          <TaskManager
            tasks={tasks}
            categories={categories}
            onTaskAdd={handleTaskAdd}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            taskView={taskView}
            minimalView={minimalView}
          />
        );
      case "calendar":
        return <Calendar tasks={tasks} />;
      case "goals":
        return (
          <Goals
            goals={goals}
            tasks={tasks}
            onGoalAdd={handleGoalAdd}
            onGoalUpdate={handleGoalUpdate}
          />
        );
      default:
        return <Dashboard tasks={tasks} goals={goals} />;
    }
  };

  // ---------- المودالات ----------
  const renderModal = () => {
    if (activeModal === "settings") {
      return (
        <SettingsModal
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          fontSize={fontSize}
          setFontSize={setFontSize}
          taskView={taskView}
          setTaskView={setTaskView}
          minimalView={minimalView}
          setMinimalView={setMinimalView}
          reminderTone={reminderTone}
          setReminderTone={setReminderTone}
          onOpenSecurity={() => setActiveModal("security")}
          onClose={() => setActiveModal(null)}
        />
      );
    }
    if (activeModal === "security") {
      return (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">🔒 تأمين التطبيق</h2>
            <LockSettings password={appPassword} setPassword={setAppPassword} />
            <button
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg"
            >
              إغلاق
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  // ---------- الواجهة ----------
  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${
        fontSize === "small"
          ? "text-sm"
          : fontSize === "large"
          ? "text-lg"
          : "text-base"
      }`}
      dir="rtl"
    >
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pb-20">{renderActiveTab()}</main>
      <BottomBar
        onOpenSettings={() => setActiveModal("settings")}
        onOpenAI={() => setActiveModal("ai")}
      />
      {renderModal()}
    </div>
  );
}

export default App;

/* ============================
   LockScreen (محلي)
   ============================ */
const LockScreen = ({
  savedPassword,
  onUnlock,
}: {
  savedPassword: string;
  onUnlock: () => void;
}) => {
  const [entered, setEntered] = useState("");

  const handleUnlock = () => {
    if (entered === savedPassword) {
      onUnlock();
    } else {
      alert("❌ كلمة المرور غير صحيحة");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center">🔒 التطبيق مقفول</h2>
        <input
          type="password"
          placeholder="أدخل كلمة المرور"
          value={entered}
          onChange={(e) => setEntered(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleUnlock}
          className="w-full bg-blue-500 text-white py-2 rounded-lg"
        >
          فتح التطبيق
        </button>
      </div>
    </div>
  );
};

/* ============================
   LockSettings (محلي)
   ============================ */
const LockSettings = ({
  password,
  setPassword,
}: {
  password: string | null;
  setPassword: (pw: string | null) => void;
}) => {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [oldPw, setOldPw] = useState("");

  const handleSetPassword = () => {
    if (!newPw || !confirmPw) return alert("أدخل كلمة المرور وتأكيدها");
    if (newPw !== confirmPw) return alert("كلمتا المرور غير متطابقتين");
    setPassword(newPw);
    setNewPw("");
    setConfirmPw("");
    alert("✅ تم إنشاء كلمة المرور بنجاح");
  };

  const handleChangePassword = () => {
    if (oldPw !== password) return alert("❌ كلمة المرور القديمة غير صحيحة");
    if (!newPw || !confirmPw) return alert("أدخل كلمة المرور الجديدة وتأكيدها");
    if (newPw !== confirmPw) return alert("كلمتا المرور غير متطابقتين");
    setPassword(newPw);
    setOldPw("");
    setNewPw("");
    setConfirmPw("");
    alert("✅ تم تغيير كلمة المرور");
  };

  const handleRemovePassword = () => {
    if (oldPw !== password) return alert("❌ كلمة المرور القديمة غير صحيحة");
    setPassword(null);
    setOldPw("");
    alert("✅ تم إلغاء كلمة المرور");
  };

  return (
    <div className="space-y-6">
      {!password ? (
        <>
          <h3 className="text-lg font-bold">🔐 إنشاء كلمة مرور</h3>
          <input
            type="password"
            placeholder="كلمة المرور"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="تأكيد كلمة المرور"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleSetPassword}
            className="w-full bg-blue-500 text-white py-2 rounded-lg"
          >
            حفظ
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold">🔐 إدارة كلمة المرور</h3>

          <div className="space-y-2">
            <input
              type="password"
              placeholder="كلمة المرور القديمة"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="كلمة المرور الجديدة"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="تأكيد كلمة المرور الجديدة"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleChangePassword}
              className="w-full bg-green-500 text-white py-2 rounded-lg"
            >
              تغيير كلمة المرور
            </button>
          </div>

          <button
            onClick={handleRemovePassword}
            className="w-full bg-red-500 text-white py-2 rounded-lg mt-4"
          >
            إلغاء كلمة المرور
          </button>
        </>
      )}
    </div>
  );
};

/* ============================
   SettingsModal (محلي)
   ============================ */
const SettingsModal = ({
  darkMode,
  setDarkMode,
  fontSize,
  setFontSize,
  taskView,
  setTaskView,
  minimalView,
  setMinimalView,
  reminderTone,
  setReminderTone,
  onOpenSecurity,
  onClose,
}: any) => (
  <div className="fixed inset-0 bg-black/40 flex items-end z-50">
    <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">⚙️ إعدادات التطبيق</h2>

      <div className="flex items-center justify-between mb-4">
        <span>الوضع الليلي</span>
        <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
      </div>

      <div className="mb-4">
        <span className="block mb-2">حجم الخط</span>
        <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full p-2 border rounded">
          <option value="small">صغير</option>
          <option value="normal">عادي</option>
          <option value="large">كبير</option>
        </select>
      </div>

      <div className="mb-4">
        <span className="block mb-2">نمط عرض المهام</span>
        <select value={taskView} onChange={(e) => setTaskView(e.target.value)} className="w-full p-2 border rounded">
          <option value="list">قائمة</option>
          <option value="grid">شبكة</option>
        </select>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span>📋 عرض مختصر</span>
        <input type="checkbox" checked={minimalView} onChange={(e) => setMinimalView(e.target.checked)} />
      </div>

      <div className="mb-4">
        <span className="block mb-2">🔔 نغمة التذكيرات</span>
        <select value={reminderTone} onChange={(e) => setReminderTone(e.target.value)} className="w-full p-2 border rounded">
          <option value="default">افتراضية</option>
          <option value="chime">Chime</option>
          <option value="beep">Beep</option>
        </select>
      </div>

      <button onClick={onOpenSecurity} className="w-full bg-purple-600 text-white py-2 rounded-lg mt-4">
        🔒 تأمين التطبيق
      </button>

      <button onClick={onClose} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg">
        إغلاق
      </button>
    </div>
  </div>
);
