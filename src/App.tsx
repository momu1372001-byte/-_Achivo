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

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false); // صفحة "تأمين التطبيق"

  // ✅ إعدادات عامة
  const [darkMode, setDarkMode] = useLocalStorage<boolean>("settings-darkMode", false);
  const [themeColor, setThemeColor] = useLocalStorage<string>("settings-themeColor", "blue");
  const [fontSize, setFontSize] = useLocalStorage<string>("settings-fontSize", "normal");
  const [taskView, setTaskView] = useLocalStorage<string>("settings-taskView", "list");
  const [reminderTone, setReminderTone] = useLocalStorage<string>("settings-reminderTone", "default");
  const [minimalView, setMinimalView] = useLocalStorage<boolean>("settings-minimalView", false);

  // ✅ تأمين التطبيق
  const [appSecured, setAppSecured] = useLocalStorage<boolean>("settings-appSecured", false);
  const [appPassword, setAppPassword] = useLocalStorage<string | null>("settings-appPassword", null);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ تفعيل الوضع الليلي
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // ✅ تطبيق اللون الأساسي
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-color", themeColor);
  }, [themeColor]);

  // ✅ البيانات
  const [tasks, setTasks] = useLocalStorage<Task[]>("productivity-tasks", initialTasks);
  const [categories, setCategories] = useLocalStorage<Category[]>("productivity-categories", initialCategories);
  const [goals, setGoals] = useLocalStorage<Goal[]>("productivity-goals", initialGoals);

  // ✅ الذكاء الاصطناعي
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch("http://localhost:4000/ai-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: tasks.map((t) => t.title) }),
        });
        const data = await response.json();
        setAiInsights(data.insights);
      } catch (error) {
        console.error("خطأ في جلب تحليلات الذكاء الاصطناعي:", error);
      }
    };
    if (tasks.length > 0) fetchInsights();
  }, [tasks]);

  // ✅ إدارة المهام
  const handleTaskAdd = (newTask: Omit<Task, "id">) => {
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks((prev) => [...prev, task]);
  };
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
  };
  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  // ✅ إدارة الأهداف
  const handleGoalAdd = (newGoal: Omit<Goal, "id">) => {
    const goal: Goal = { ...newGoal, id: Date.now().toString() };
    setGoals((prev) => [...prev, goal]);
  };
  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoals((prev) => prev.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal)));
  };

  // ✅ التبويب النشط
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <Dashboard tasks={tasks} goals={goals} />
            {aiInsights && (
              <div className="m-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow">
                <h2 className="text-lg font-bold mb-2">🤖 تحليلات الذكاء الاصطناعي</h2>
                <p className="text-gray-700">{aiInsights}</p>
              </div>
            )}
          </>
        );
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
        return <Goals goals={goals} tasks={tasks} onGoalAdd={handleGoalAdd} onGoalUpdate={handleGoalUpdate} />;
      default:
        return <Dashboard tasks={tasks} goals={goals} />;
    }
  };

  // ✅ شاشة القفل (لو التطبيق مؤمَّن)
  if (appSecured && appPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-80">
          <h2 className="text-xl font-bold mb-4 text-center">🔒 أدخل كلمة المرور</h2>
          <input
            type="password"
            placeholder="كلمة المرور"
            value={enteredPassword}
            onChange={(e) => {
              setEnteredPassword(e.target.value);
              setErrorMessage("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (enteredPassword === appPassword) {
                  setEnteredPassword("");
                  setErrorMessage("");
                  setAppSecured(false); // يفتح الجلسة الحالية
                } else {
                  setErrorMessage("❌ كلمة المرور غير صحيحة");
                }
              }
            }}
            className="w-full p-2 border rounded mb-2"
          />
          {errorMessage && <p className="text-red-500 text-sm mb-2">{errorMessage}</p>}
          <button
            onClick={() => {
              if (enteredPassword === appPassword) {
                setEnteredPassword("");
                setErrorMessage("");
                setAppSecured(false);
              } else {
                setErrorMessage("❌ كلمة المرور غير صحيحة");
              }
            }}
            className="w-full bg-blue-500 text-white py-2 rounded-lg"
          >
            دخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${
        fontSize === "small" ? "text-sm" : fontSize === "large" ? "text-lg" : "text-base"
      }`}
      dir="rtl"
    >
      {/* ✅ الهيدر */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* المحتوى */}
      <main className="pb-20">{renderActiveTab()}</main>

      {/* ✅ الشريط السفلي */}
      <BottomBar onOpenSettings={() => setIsSettingsOpen(true)} onOpenAI={() => setIsAIOpen(true)} />

      {/* ✅ نافذة الإعدادات */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">⚙️ إعدادات التطبيق</h2>

            {/* الوضع الليلي */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 dark:text-gray-200">الوضع الليلي</span>
              <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
            </div>

            {/* حجم الخط */}
            <div className="mb-4">
              <span className="block mb-2 text-gray-700 dark:text-gray-200">حجم الخط</span>
              <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full p-2 border rounded">
                <option value="small">صغير</option>
                <option value="normal">عادي</option>
                <option value="large">كبير</option>
              </select>
            </div>

            {/* نمط عرض المهام */}
            <div className="mb-4">
              <span className="block mb-2 text-gray-700 dark:text-gray-200">نمط عرض المهام</span>
              <select value={taskView} onChange={(e) => setTaskView(e.target.value)} className="w-full p-2 border rounded">
                <option value="list">قائمة</option>
                <option value="grid">شبكة</option>
              </select>
            </div>

            {/* العرض المختصر */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 dark:text-gray-200">📋 عرض مختصر للمهام</span>
              <input type="checkbox" checked={minimalView} onChange={(e) => setMinimalView(e.target.checked)} />
            </div>

            {/* نغمة التذكيرات */}
            <div className="mb-4">
              <span className="block mb-2 text-gray-700 dark:text-gray-200">🔔 نغمة التذكيرات</span>
              <select value={reminderTone} onChange={(e) => setReminderTone(e.target.value)} className="w-full p-2 border rounded">
                <option value="default">افتراضية</option>
                <option value="chime">Chime</option>
                <option value="beep">Beep</option>
              </select>
            </div>

            {/* رابط لتأمين التطبيق */}
            <button
              onClick={() => {
                setIsSettingsOpen(false);
                setIsSecurityOpen(true);
              }}
              className="w-full bg-purple-600 text-white py-2 rounded-lg mt-4"
            >
              🔒 تأمين التطبيق
            </button>

            <button onClick={() => setIsSettingsOpen(false)} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ✅ نافذة تأمين التطبيق */}
      {isSecurityOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg">
            <h2 className="text-lg font-bold mb-4">🔒 إدارة تأمين التطبيق</h2>

            {!appPassword && (
              <>
                <p className="mb-2">إنشاء كلمة مرور جديدة:</p>
                <PasswordSetup
                  onComplete={(pwd) => {
                    setAppPassword(pwd);
                    setAppSecured(true);
                    alert("✅ تم تعيين كلمة المرور بنجاح!");
                    setIsSecurityOpen(false);
                  }}
                />
              </>
            )}

            {appPassword && (
              <>
                <PasswordManager
                  currentPassword={appPassword}
                  onDisable={() => {
                    setAppPassword(null);
                    setAppSecured(false);
                    alert("✅ تم إلغاء تأمين التطبيق.");
                    setIsSecurityOpen(false);
                  }}
                  onChangePassword={(newPwd) => {
                    setAppPassword(newPwd);
                    alert("✅ تم تغيير كلمة المرور.");
                    setIsSecurityOpen(false);
                  }}
                />
              </>
            )}

            <button onClick={() => setIsSecurityOpen(false)} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ✅ نافذة AI */}
      {isAIOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-4 rounded-t-2xl shadow-lg">
            <h2 className="text-lg font-bold mb-4">🤖 المساعد الذكي</h2>
            <p className="text-gray-600 dark:text-gray-300">هنا هيظهر مساعد AI (خطة يومية، نصائح، توليد أهداف...)</p>
            <button onClick={() => setIsAIOpen(false)} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg">
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ كومبوننت لإنشاء كلمة مرور جديدة
const PasswordSetup: React.FC<{ onComplete: (pwd: string) => void }> = ({ onComplete }) => {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  return (
    <div>
      <input
        type="password"
        placeholder="كلمة المرور"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <input
        type="password"
        placeholder="تأكيد كلمة المرور"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <button
        onClick={() => {
          if (!pwd || pwd.length < 4) return setError("❌ كلمة المرور يجب أن تكون 4 أحرف على الأقل");
          if (pwd !== confirm) return setError("❌ كلمتا المرور غير متطابقتين");
          onComplete(pwd);
        }}
        className="w-full bg-green-600 text-white py-2 rounded-lg"
      >
        إنشاء كلمة المرور
      </button>
    </div>
  );
};

// ✅ كومبوننت لإدارة كلمة المرور
const PasswordManager: React.FC<{
  currentPassword: string;
  onDisable: () => void;
  onChangePassword: (newPwd: string) => void;
}> = ({ currentPassword, onDisable, onChangePassword }) => {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  return (
    <div>
      {/* تغيير كلمة المرور */}
      <h3 className="font-semibold mb-2">تغيير كلمة المرور:</h3>
      <input
        type="password"
        placeholder="كلمة المرور الحالية"
        value={oldPwd}
        onChange={(e) => setOldPwd(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <input
        type="password"
        placeholder="كلمة المرور الجديدة"
        value={newPwd}
        onChange={(e) => setNewPwd(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <input
        type="password"
        placeholder="تأكيد كلمة المرور الجديدة"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <button
        onClick={() => {
          if (oldPwd !== currentPassword) return setError("❌ كلمة المرور الحالية غير صحيحة");
          if (newPwd.length < 4) return setError("❌ كلمة المرور يجب أن تكون 4 أحرف على الأقل");
          if (newPwd !== confirm) return setError("❌ كلمتا المرور غير متطابقتين");
          onChangePassword(newPwd);
        }}
        className="w-full bg-yellow-500 text-white py-2 rounded-lg mb-4"
      >
        تغيير كلمة المرور
      </button>

      {/* إلغاء القفل */}
      <h3 className="font-semibold mb-2">إلغاء تأمين التطبيق:</h3>
      <input
        type="password"
        placeholder="أدخل كلمة المرور الحالية"
        value={oldPwd}
        onChange={(e) => setOldPwd(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <button
        onClick={() => {
          if (oldPwd !== currentPassword) return setError("❌ كلمة المرور غير صحيحة");
          onDisable();
        }}
        className="w-full bg-red-600 text-white py-2 rounded-lg"
      >
        إلغاء التأمين
      </button>
    </div>
  );
};

export default App;
