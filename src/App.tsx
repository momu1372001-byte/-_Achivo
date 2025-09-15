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

/**
 * App.tsx
 * تطبيق منظم المهام الرئيسي - به:
 * - شريط علوي (Header)
 * - تبويبات (لوحة تحكم / مهام / تقويم / أهداف)
 * - شريط سفلي مع فتح الإعدادات وAI
 * - مودال إعدادات موحد
 * - مودال تأمين التطبيق (إنشاء/تغيير/إلغاء كلمة مرور)
 * - شاشة قفل تظهر عند إعادة فتح التطبيق إذا كان مؤمّنًا
 *
 * سلوك احترافي: عند فتح مودال جديد يُغلق أي مودال آخر.
 */

// نوع المودال النشط
type ActiveModal = "settings" | "security" | "ai" | null;

function App() {
  // تبويبات التطبيق
  const [activeTab, setActiveTab] = useState<"dashboard" | "tasks" | "calendar" | "goals">("dashboard");

  // مودال نشط واحد في كل مرة
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // ---------- إعدادات عامة محفوظة ----------
  const [darkMode, setDarkMode] = useLocalStorage<boolean>("settings-darkMode", false);
  const [themeColor, setThemeColor] = useLocalStorage<string>("settings-theme-color", "blue");
  const [fontSize, setFontSize] = useLocalStorage<string>("settings-font-size", "normal");
  const [taskView, setTaskView] = useLocalStorage<"list" | "grid">("settings-task-view", "list");
  const [reminderTone, setReminderTone] = useLocalStorage<string>("settings-reminder-tone", "default");
  const [minimalView, setMinimalView] = useLocalStorage<boolean>("settings-minimal-view", false);

  // ---------- تأمين التطبيق (Password Management) ----------
  // appPassword: null => لا توجد كلمة مرور، سترى واجهة إنشاء عند الدخول إلى "تأمين التطبيق"
  const [appPassword, setAppPassword] = useLocalStorage<string | null>("settings-app-password", null);
  // appSecured: علامة مؤقتة لجلسة التطبيق التي تُحظر عند إعادة فتح التطبيق
  // نستخدم appLockedSession لتحديد إن شاشة القفل يجب أن تظهر (true => عرض شاشة القفل)
  const [appLockedSession, setAppLockedSession] = useState<boolean>(false);
  const [enteredPassword, setEnteredPassword] = useState<string>("");
  const [lockError, setLockError] = useState<string>("");

  // ---------- تفعيل السمات العامة ----------
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    // نقوم فقط بتعيين متغير CSS عام للون الواجهة إن أردت استخدامه في CSS
    document.documentElement.style.setProperty("--theme-color", themeColor);
  }, [themeColor]);

  // ---------- بيانات التطبيق (Tasks/Categories/Goals) محفوظة محليًا ----------
  const [tasks, setTasks] = useLocalStorage<Task[]>("productivity-tasks", initialTasks);
  const [categories, setCategories] = useLocalStorage<Category[]>("productivity-categories", initialCategories);
  const [goals, setGoals] = useLocalStorage<Goal[]>("productivity-goals", initialGoals);

  // ---------- تحليلات AI (مثال اتصال بخادم محلي) ----------
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
        setAiInsights(data.insights || null);
      } catch (err) {
        // لا نقطع تجربة المستخدم إذا فشل السيرفر - مجرد console.warn
        console.warn("تعذر الوصول لسيرفر AI:", err);
        setAiInsights(null);
      }
    };
    if (tasks.length > 0) fetchInsights();
  }, [tasks]);

  // ---------- عند بدء الجلسة - إذا كانت هناك كلمة مرور مخزنة نجعل الجلسة مقفولة ----------
  useEffect(() => {
    // عند تحميل التطبيق لأول مرة، إن كانت كلمة مرور مخزنة نطالب بالقفل عند بداية الجلسة
    if (appPassword) {
      setAppLockedSession(true);
    } else {
      setAppLockedSession(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ننفذ مرة واحدة عند mount

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

  // ---------- شاشة القفل (تُعرض لو كانت الجلسة مقفولة) ----------
  if (appLockedSession && appPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900" dir="rtl">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-center">🔒 التطبيق مؤمّن</h2>

          <input
            type="password"
            placeholder="أدخل كلمة المرور"
            value={enteredPassword}
            onChange={(e) => {
              setEnteredPassword(e.target.value);
              setLockError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (enteredPassword === appPassword) {
                  // فتح الجلسة الحالية فقط (لا نحذف كلمة المرور)
                  setAppLockedSession(false);
                  setEnteredPassword("");
                } else {
                  setLockError("❌ كلمة المرور غير صحيحة");
                }
              }
            }}
            className="w-full px-4 py-2 border rounded mb-3 dark:bg-gray-900"
          />

          {lockError && <p className="text-red-500 text-sm mb-3">{lockError}</p>}

          <button
            onClick={() => {
              if (enteredPassword === appPassword) {
                setAppLockedSession(false);
                setEnteredPassword("");
                setLockError("");
              } else {
                setLockError("❌ كلمة المرور غير صحيحة");
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            فتح التطبيق
          </button>

          <p className="text-xs text-gray-500 mt-3">أدخل كلمة المرور التي أنشأتها للوصول إلى التطبيق.</p>
        </div>
      </div>
    );
  }

  // ---------- تبويب النشاط الفعّال ----------
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <Dashboard tasks={tasks} goals={goals} />
            {aiInsights && (
              <div className="m-4 p-4 bg-blue-50 border rounded-lg shadow">
                <h2 className="font-bold mb-2">🤖 تحليلات الذكاء الاصطناعي</h2>
                <p>{aiInsights}</p>
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

  // ---------- مودال المودالات (نفتح مودال واحد فقط) ----------
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
        <SecurityModal
          appPassword={appPassword}
          setAppPassword={setAppPassword}
          setAppLockedSession={setAppLockedSession}
          onClose={() => setActiveModal(null)}
        />
      );
    }
    if (activeModal === "ai") {
      return (
        <AiModal
          onClose={() => setActiveModal(null)}
        />
      );
    }
    return null;
  };

  // ---------- الواجهة الرئيسية ----------
  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${fontSize === "small" ? "text-sm" : fontSize === "large" ? "text-lg" : "text-base"}`}
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
   SettingsModal component
   - تعرض خيارات عامة
   - تحتوي زر "تأمين التطبيق" الذي يفتح SecurityModal
   ============================ */
const SettingsModal = (props: {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  fontSize: string;
  setFontSize: (v: string) => void;
  taskView: "list" | "grid";
  setTaskView: (v: "list" | "grid") => void;
  minimalView: boolean;
  setMinimalView: (v: boolean) => void;
  reminderTone: string;
  setReminderTone: (v: string) => void;
  onOpenSecurity: () => void;
  onClose: () => void;
}) => {
  const {
    darkMode, setDarkMode,
    fontSize, setFontSize,
    taskView, setTaskView,
    minimalView, setMinimalView,
    reminderTone, setReminderTone,
    onOpenSecurity, onClose
  } = props;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50">
      <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">⚙️ الإعدادات</h2>

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
          <select value={taskView} onChange={(e) => setTaskView(e.target.value as "list" | "grid")} className="w-full p-2 border rounded">
            <option value="list">قائمة</option>
            <option value="grid">شبكة</option>
          </select>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span>📋 عرض مختصر للمهام</span>
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
};

/* ============================
   SecurityModal component
   - إدارة كلمة المرور: إنشاء / تغيير / إلغاء
   - لا يقوم المودال بإغلاق التطبيق بعد الحفظ (تجربة طبيعية)
   - بعد إنشاء أو تغيير يتم إظهار رسالة نجاح ويغلق المودال فقط
   - إذا ألغيت التأمين (remove) نقوم بحذف كلمة المرور وتحرير الجلسة
   ============================ */
const SecurityModal = (props: {
  appPassword: string | null;
  setAppPassword: (pw: string | null) => void;
  setAppLockedSession: (v: boolean) => void;
  onClose: () => void;
}) => {
  const { appPassword, setAppPassword, setAppLockedSession, onClose } = props;

  type Mode = "setup" | "change" | "disable";
  const [mode, setMode] = useState<Mode>(appPassword ? "change" : "setup");

  const [oldPwd, setOldPwd] = useState<string>("");
  const [newPwd, setNewPwd] = useState<string>("");
  const [confirmPwd, setConfirmPwd] = useState<string>("");
  const [error, setError] = useState<string>("");

  const resetFields = () => {
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setError("");
  };

  const handleSetup = () => {
    if (!newPwd || newPwd.length < 4) return setError("كلمة المرور يجب أن تكون 4 أحرف على الأقل");
    if (newPwd !== confirmPwd) return setError("كلمتا المرور غير متطابقتين");
    setAppPassword(newPwd);
    // بعد التعيين نعلّم أن الجلسة يجب أن تطلب القفل عند إعادة فتح التطبيق
    setAppLockedSession(true);
    alert("✅ تم إنشاء كلمة المرور بنجاح");
    resetFields();
    onClose();
  };

  const handleChange = () => {
    if (!appPassword) return setError("لا توجد كلمة مرور حالية");
    if (oldPwd !== appPassword) return setError("كلمة المرور القديمة غير صحيحة");
    if (!newPwd || newPwd.length < 4) return setError("كلمة المرور الجديدة قصيرة");
    if (newPwd !== confirmPwd) return setError("كلمتا المرور غير متطابقتين");
    setAppPassword(newPwd);
    alert("✅ تم تغيير كلمة المرور");
    resetFields();
    onClose();
  };

  const handleDisable = () => {
    if (!appPassword) return setError("لا توجد كلمة مرور ليتم إلغاؤها");
    if (oldPwd !== appPassword) return setError("كلمة المرور الحالية غير صحيحة");
    setAppPassword(null);
    // عند إلغاء التأمين نفك القفل للجلسة الحالية بحيث لا تظهر شاشة القفل حتى يتم إعادة تشغيل التطبيق
    setAppLockedSession(false);
    alert("✅ تم إلغاء تأمين التطبيق");
    resetFields();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50">
      <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg">
        <h2 className="text-lg font-bold mb-4">🔒 تأمين التطبيق</h2>

        {/* اختيار النمط */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setMode("setup"); resetFields(); }}
            className={`flex-1 py-2 rounded ${mode === "setup" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            إنشاء
          </button>
          <button
            onClick={() => { setMode("change"); resetFields(); }}
            className={`flex-1 py-2 rounded ${mode === "change" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            تغيير
          </button>
          <button
            onClick={() => { setMode("disable"); resetFields(); }}
            className={`flex-1 py-2 rounded ${mode === "disable" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            إلغاء
          </button>
        </div>

        {/* المحフォーム تبع الوضع */}
        {mode === "setup" && (
          <>
            <input value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="كلمة المرور" type="password" className="w-full p-2 border rounded mb-2" />
            <input value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="تأكيد كلمة المرور" type="password" className="w-full p-2 border rounded mb-2" />
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <button onClick={handleSetup} className="w-full bg-green-600 text-white py-2 rounded">حفظ</button>
          </>
        )}

        {mode === "change" && (
          <>
            <input value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} placeholder="كلمة المرور الحالية" type="password" className="w-full p-2 border rounded mb-2" />
            <input value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="كلمة المرور الجديدة" type="password" className="w-full p-2 border rounded mb-2" />
            <input value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="تأكيد كلمة المرور الجديدة" type="password" className="w-full p-2 border rounded mb-2" />
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <button onClick={handleChange} className="w-full bg-yellow-500 text-white py-2 rounded mb-2">تغيير</button>
            <button onClick={handleDisable} className="w-full bg-red-600 text-white py-2 rounded">إلغاء التأمين</button>
          </>
        )}

        {mode === "disable" && (
          <>
            <input value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} placeholder="أدخل كلمة المرور الحالية لإلغاء التأمين" type="password" className="w-full p-2 border rounded mb-2" />
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <button onClick={handleDisable} className="w-full bg-red-600 text-white py-2 rounded">إلغاء التأمين</button>
          </>
        )}

        <button onClick={onClose} className="mt-4 w-full bg-blue-500 text-white py-2 rounded">إغلاق</button>
      </div>
    </div>
  );
};

/* ============================
   AiModal (مؤقت/مستقبلي)
   ============================ */
const AiModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50">
      <div className="bg-white dark:bg-gray-800 w-full p-4 rounded-t-2xl shadow-lg">
        <h2 className="text-lg font-bold mb-4">🤖 المساعد الذكي</h2>
        <p className="text-gray-600 dark:text-gray-300">هنا ستُعرض ميزات الذكاء الاصطناعي (خطط يومية، نصائح، ...)</p>
        <button onClick={onClose} className="mt-4 w-full bg-blue-500 text-white py-2 rounded">إغلاق</button>
      </div>
    </div>
  );
};
