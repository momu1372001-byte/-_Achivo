// src/App.tsx
import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { TaskManager } from "./components/TaskManager";
import { Calendar } from "./components/Calendar";
import Goals from "./components/Goals";
import { Task, Category, Goal } from "./types";

type Note = {
  id: string;
  title: string;
  content?: string;
  createdAt?: string;
};

import { useLocalStorage } from "./hooks/useLocalStorage";
import Notes from "./components/Notes";
const NotesAny = (Notes as unknown) as React.FC<any>;
import DrawingPad from "./components/DrawingPad";
import PomodoroTimer from "./components/PomodoroTimer";
import Calculator from "./components/Calculator";
import UnifiedBottomNav from "./components/UnifiedBottomNav";
import { initialCategories, initialTasks, initialGoals } from "./data/initialData";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";

type ActiveModal = "settings" | "security" | "ai" | null;
type Tabs =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "goals"
  | "notes"
  | "draw"
  | "pomodoro"
  | "calculator";

const AppContent: React.FC = () => {
  const { theme } = useTheme(); // موجود في ThemeContext الذي وضعتَه
  const [activeTab, setActiveTab] = useState<Tabs>("dashboard");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // ⚙️ إعدادات عامة
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(
    "settings-darkMode",
    false
  );
  const [fontSize, setFontSize] = useLocalStorage<string>(
    "settings-font-size",
    "normal"
  );
  const [taskView, setTaskView] = useLocalStorage<"list" | "grid">(
    "settings-task-view",
    "list"
  );
  const [reminderTone, setReminderTone] = useLocalStorage<string>(
    "settings-reminder-tone",
    "default"
  );
  const [minimalView, setMinimalView] = useLocalStorage<boolean>(
    "settings-minimal-view",
    false
  );

  // 🌐 لغة الواجهة
  


const [language, setLanguage] = useLocalStorage<"ar" | "en">(
  "settings-language",
  "ar"
);


const [notes, setNotes] = useLocalStorage<Note[]>("productivity-notes", []);


  // 🔒 كلمة المرور / قفل الجلسة
  const [appPassword, setAppPassword] = useLocalStorage<string | null>(
    "settings-app-password",
    null
  );
  const [appLockedSession, setAppLockedSession] = useState<boolean>(false);

  // 🗂️ البيانات
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    "productivity-tasks",
    initialTasks
  );
  const [categories, setCategories] = useLocalStorage<Category[]>(
    "productivity-categories",
    initialCategories
  );
  const [goals, setGoals] = useLocalStorage<Goal[]>(
    "productivity-goals",
    initialGoals
  );

  // 🤖 AI Insights (محاولة اتصال محليّ بسيرفر AI)
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
        setAiInsights(data?.insights || null);
      } catch {
        console.warn("⚠️ تعذّر الاتصال بسيرفر AI.");
      }
    };
    if (tasks.length > 0) fetchInsights();
  }, [tasks]);

  // 🌓 الوضع الليلي في الـ <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", !!darkMode);
  }, [darkMode]);

  // 🔁 ضبط لغة المستند (dir + lang)
  useEffect(() => {
    document.documentElement.setAttribute("lang", language === "ar" ? "ar" : "en");
    document.documentElement.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
  }, [language]);








// 🔙 التعامل مع زر الرجوع في الموبايل
useEffect(() => {
  const handleBackButton = (event: PopStateEvent) => {
    event.preventDefault();

    // لو عندك مودال مفتوح، نقفله أولاً
    if (activeModal) {
      setActiveModal(null);
      return;
    }

    // لو المستخدم داخل تبويب غير الـ Dashboard نرجعه لها
    if (activeTab !== "dashboard") {
      setActiveTab("dashboard");
      return;
    }

    // لو هو فعلاً في الـ Dashboard، نغلق التطبيق (في الموبايل فقط)
    if (window.navigator.userAgent.includes("Android")) {
      // هذا فقط يعمل في بيئة WebView أو تطبيق موبايل (Cordova, Capacitor ...)
      (window as any).ReactNativeWebView?.postMessage("exitApp");
    }
  };

  window.addEventListener("popstate", handleBackButton);

  return () => {
    window.removeEventListener("popstate", handleBackButton);
  };
}, [activeModal, activeTab]);



















  // 🚪 بداية الجلسة
  useEffect(() => {
    if (appPassword) setAppLockedSession(true);
    else setAppLockedSession(false);
  }, [appPassword]);

  /* ================================
     تشغيل نغمة التذكيرات
  =================================*/
  const playReminderTone = (tone: string) => {
    let file = "/sounds/default.mp3";
    if (tone === "chime") file = "/sounds/chime.mp3";
    if (tone === "beep") file = "/sounds/beep.mp3";

    const audio = new Audio(file);
    audio.play().catch(() => console.warn("⚠️ تعذّر تشغيل الصوت"));
  };

  // ===========================
  // إدارة المهام (CRUD)
  // ===========================
  const handleTaskAdd = (newTask: Omit<Task, "id">) => {
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks((prev) => [...prev, task]);
    playReminderTone(reminderTone);
  };
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };
  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // 🎯 إدارة الأهداف
  const handleGoalAdd = (newGoal: Omit<Goal, "id">) => {
    const goal: Goal = { ...newGoal, id: Date.now().toString() };
    setGoals((prev) => [...prev, goal]);
    playReminderTone(reminderTone);
  };
  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  };
  const handleGoalDelete = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  // ===========================
  // إدارة التصنيفات
  // ===========================
  const getDefaultCategoryName = (cats: Category[]) => {
    return cats && cats.length > 0 ? cats[0].name : language === "ar" ? "عام" : "General";
  };

  const handleCategoryAdd = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newCat: Category = { id: Date.now().toString(), name: trimmed, color: '#808080', icon: '📁' };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleCategoryUpdate = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
  };

  const handleCategoryDelete = (id: string) => {
    setCategories((prevCats) => {
      const toDelete = prevCats.find((c) => c.id === id);
      const newCats = prevCats.filter((c) => c.id !== id);
      const newDefault = getDefaultCategoryName(newCats);

      if (toDelete) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.category === toDelete.name ? { ...t, category: newDefault } : t))
        );
      }
      return newCats;
    });
  };

  // 🔐 قفل الشاشة (إذا لازم)
  if (appLockedSession && appPassword) {
    return <LockScreen savedPassword={appPassword} onUnlock={() => setAppLockedSession(false)} />;
  }

  // التبويبات
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <Dashboard 
  tasks={tasks} 
  goals={goals} 
  categories={categories}
  notes={notes}
  setNotes={setNotes}
  language={language as "ar" | "en"} 
  onTaskUpdate={handleTaskUpdate}
  onTaskDelete={handleTaskDelete}
  onTaskAdd={handleTaskAdd}
  onOpenGoals={() => setActiveTab("goals")}
  onOpenAddTask={() => setActiveTab("tasks")} 
  onOpenNotes={() => setActiveTab("notes")} // هذا مهم

/>

            
            
            
            {aiInsights && (
              <div className="m-4 p-4 border rounded-lg shadow border-blue-500">
                <h2 className="font-bold mb-2 text-blue-500">
                  🤖 {language === "ar" ? "تحليلات الذكاء الاصطناعي" : "AI Insights"}
                </h2>
                <p className="text-gray-700 dark:text-gray-300">{aiInsights}</p>
              </div>
            )}
          </>
        );

      case "calculator":
        return <Calculator />;

      
case "notes":
    return (
      <NotesAny
        language={language}
        notes={notes}
        setNotes={setNotes}
      />
    );
     






      case "pomodoro":
        return <PomodoroTimer language={language} />;

      case "draw":
        return <DrawingPad language={language} />;

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
            language={language}
          />
        );

      case "calendar":
        return <Calendar tasks={tasks} language={language} />;

      case "goals":
        return (
          <Goals
            goals={goals}
            tasks={tasks}
            onGoalAdd={handleGoalAdd}
            onGoalUpdate={handleGoalUpdate}
            onGoalDelete={handleGoalDelete}
            language={language as "ar" | "en"}
          />
        );

      default:
         
        
    return    <Dashboard 
  tasks={tasks} 
  goals={goals} 
  categories={categories}
  notes={notes} 
  setNotes={setNotes}
  language={language} 
  onTaskUpdate={handleTaskUpdate} 
  onTaskDelete={handleTaskDelete} 
  onTaskAdd={handleTaskAdd} 
/>

        
    
    
      }

  };

  // المودالات
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
          categories={categories}
          setCategories={setCategories}
          onAddCategory={handleCategoryAdd}
          onUpdateCategory={handleCategoryUpdate}
          onDeleteCategory={handleCategoryDelete}
          language={language}
          setLanguage={setLanguage}
          onOpenSecurity={() => setActiveModal("security")}
          onClose={() => setActiveModal(null)}
        />
      );
    }

    if (activeModal === "security") {
      return (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100">
            <h2 className="text-lg font-bold mb-4 text-blue-500">
              🔒 {language === "ar" ? "تأمين التطبيق" : "App Security"}
            </h2>
            <LockSettings password={appPassword} setPassword={setAppPassword} language={language} />
            <button
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full text-white py-2 rounded-lg bg-blue-500"
            >
              {language === "ar" ? "إغلاق" : "Close"}
            </button>
          </div>
        </div>
      );
    }

    if (activeModal === "ai") {
      return <AiModal onClose={() => setActiveModal(null)} language={language} />;
    }

    return null;
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
        fontSize === "small" ? "text-sm" : fontSize === "large" ? "text-lg" : "text-base"
      }`}
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <Header activeTab={activeTab} setActiveTab={setActiveTab} language={language} setLanguage={setLanguage} />

      <main className="pb-20">{renderActiveTab()}</main>

      <UnifiedBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setActiveModal("settings")}
        onOpenAI={() => setActiveModal("ai")}
        language={language as "ar" | "en"}
      />

      {renderModal()}
    </div>
  );
};

// نغلف AppContent داخل ThemeProvider حتى تستفيد الـ context
export default function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

/* ================================
   LockScreen
   ================================ */
const LockScreen = ({ savedPassword, onUnlock }: { savedPassword: string; onUnlock: () => void }) => {
  const [entered, setEntered] = useState("");
  const [error, setError] = useState("");

  const handleUnlock = () => {
    if (entered === savedPassword) {
      setError("");
      onUnlock();
      setEntered("");
    } else {
      setError("❌ كلمة المرور غير صحيحة");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center">🔒 التطبيق مقفول</h2>
        <input
          type="password"
          placeholder="أدخل كلمة المرور"
          value={entered}
          onChange={(e) => {
            setEntered(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUnlock();
          }}
          className="w-full p-2 border rounded mb-3 dark:bg-gray-900"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button onClick={handleUnlock} className="w-full text-white py-2 rounded bg-blue-500">
          فتح التطبيق
        </button>
      </div>
    </div>
  );
};

/* ================================
   LockSettings
   ================================ */
const LockSettings = ({
  password,
  setPassword,
  language,
}: {
  password: string | null;
  setPassword: (pw: string | null) => void;
  language: string;
}) => {
  const [mode, setMode] = useState<"setup" | "change" | "remove">(password ? "change" : "setup");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const reset = () => {
    setOldPw("");
    setNewPw("");
    setConfirmPw("");
  };

  const handleCreate = () => {
    setMessage(null);
    if (!newPw || newPw.length < 4) {
      setMessage({ type: "err", text: language === "ar" ? "كلمة المرور قصيرة جداً" : "Password too short" });
      return;
    }
    if (newPw !== confirmPw) {
      setMessage({ type: "err", text: language === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match" });
      return;
    }
    setPassword(newPw);
    reset();
    setMessage({ type: "ok", text: language === "ar" ? "✅ تم إنشاء كلمة المرور" : "Password created" });
    setMode("change");
  };

  const handleChange = () => {
    if (oldPw !== password) {
      setMessage({ type: "err", text: language === "ar" ? "❌ كلمة المرور القديمة خاطئة" : "Old password incorrect" });
      return;
    }
    if (!newPw || newPw.length < 4) {
      setMessage({ type: "err", text: language === "ar" ? "كلمة المرور قصيرة جداً" : "Password too short" });
      return;
    }
    if (newPw !== confirmPw) {
      setMessage({ type: "err", text: language === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match" });
      return;
    }
    setPassword(newPw);
    reset();
    setMessage({ type: "ok", text: language === "ar" ? "✅ تم تغيير كلمة المرور" : "Password changed" });
  };

  const handleRemove = () => {
    if (oldPw !== password) {
      setMessage({ type: "err", text: language === "ar" ? "❌ كلمة المرور خاطئة" : "Password incorrect" });
      return;
    }
    setPassword(null);
    reset();
    setMode("setup");
    setMessage({ type: "ok", text: language === "ar" ? "✅ تم إلغاء كلمة المرور" : "Password removed" });
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setMode("setup");
            reset();
            setMessage(null);
          }}
          className={`flex-1 py-2 rounded ${mode === "setup" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700"}`}
        >
          {language === "ar" ? "إنشاء" : "Create"}
        </button>
        <button
          onClick={() => {
            setMode("change");
            reset();
            setMessage(null);
          }}
          className={`flex-1 py-2 rounded ${mode === "change" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700"}`}
        >
          {language === "ar" ? "تغيير" : "Change"}
        </button>
        <button
          onClick={() => {
            setMode("remove");
            reset();
            setMessage(null);
          }}
          className={`flex-1 py-2 rounded ${mode === "remove" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700"}`}
        >
          {language === "ar" ? "إلغاء" : "Remove"}
        </button>
      </div>

      {mode === "setup" && (
        <div className="space-y-3">
          <input
            type="password"
            placeholder={language === "ar" ? "كلمة المرور" : "Password"}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900"
          />
          <input
            type="password"
            placeholder={language === "ar" ? "تأكيد كلمة المرور" : "Confirm password"}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900"
          />
          <button onClick={handleCreate} className="w-full text-white py-2 rounded bg-blue-500">
            {language === "ar" ? "حفظ" : "Save"}
          </button>
        </div>
      )}

      {mode === "change" && (
        <div className="space-y-3">
          <input
            type="password"
            placeholder={language === "ar" ? "كلمة المرور الحالية" : "Current password"}
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900"
          />
          <input
            type="password"
            placeholder={language === "ar" ? "كلمة المرور الجديدة" : "New password"}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900"
          />
          <input
            type="password"
            placeholder={language === "ar" ? "تأكيد الجديدة" : "Confirm new"}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900"
          />
          <button onClick={handleChange} className="w-full text-white py-2 rounded bg-blue-500">
            {language === "ar" ? "تغيير" : "Change"}
          </button>
        </div>
      )}

      {mode === "remove" && (
        <div className="space-y-3">
          <input
            type="password"
            placeholder={language === "ar" ? "كلمة المرور الحالية" : "Current password"}
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900"
          />
          <button onClick={handleRemove} className="w-full text-white py-2 rounded bg-blue-500">
            {language === "ar" ? "إلغاء التأمين" : "Remove security"}
          </button>
        </div>
      )}

      {message && <p className={`mt-3 text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
    </div>
  );
};

/* ================================
   SettingsModal
   ================================ */
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
  categories,
  setCategories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  language,
  setLanguage,
  onOpenSecurity,
  onClose,
}: any) => {
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    onAddCategory(name);
    setNewCatName("");
    setShowAddCat(false);
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };
  const saveEdit = () => {
    if (!editingId) return;
    onUpdateCategory(editingId, editingName);
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50">
      <div className="bg-white dark:bg-gray-800 w-full p-6 rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100">
        <h2 className="text-lg font-bold mb-4">⚙️ {language === "ar" ? "إعدادات التطبيق" : "App Settings"}</h2>

        {/* الوضع الليلي */}
        <div className="flex items-center justify-between mb-4">
          <span>🌙 {language === "ar" ? "الوضع الليلي" : "Dark mode"}</span>
          <input type="checkbox" checked={darkMode} onChange={(e: any) => setDarkMode(e.target.checked)} />
        </div>

        {/* حجم الخط */}
        <div className="mb-4">
          <span className="block mb-2">🔠 {language === "ar" ? "حجم الخط" : "Font size"}</span>
          <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900">
            <option value="small">{language === "ar" ? "صغير" : "Small"}</option>
            <option value="normal">{language === "ar" ? "عادي" : "Normal"}</option>
            <option value="large">{language === "ar" ? "كبير" : "Large"}</option>
          </select>
        </div>

        {/* نمط عرض المهام */}
        <div className="mb-4">
          <span className="block mb-2">📋 {language === "ar" ? "نمط عرض المهام" : "Task view"}</span>
          <select value={taskView} onChange={(e) => setTaskView(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900">
            <option value="list">{language === "ar" ? "قائمة" : "List"}</option>
            <option value="grid">{language === "ar" ? "شبكة" : "Grid"}</option>
          </select>
        </div>

        {/* عرض مختصر */}
        <div className="flex items-center justify-between mb-4">
          <span>🔎 {language === "ar" ? "عرض مختصر" : "Minimal view"}</span>
          <input type="checkbox" checked={minimalView} onChange={(e: any) => setMinimalView(e.target.checked)} />
        </div>

        {/* نغمة التذكيرات */}
        <div className="mb-4">
          <span className="block mb-2">🔔 {language === "ar" ? "نغمة التذكيرات" : "Reminder tone"}</span>
          <select value={reminderTone} onChange={(e) => setReminderTone(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900">
            <option value="default">{language === "ar" ? "افتراضية" : "Default"}</option>
            <option value="chime">Chime</option>
            <option value="beep">Beep</option>
          </select>
        </div>

        {/* اختيار اللغة */}
        <div className="mb-4">
          <span className="block mb-2">🌐 {language === "ar" ? "لغة الواجهة" : "Interface language"}</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-900">
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* إدارة التصنيفات */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{language === "ar" ? "التصنيفات" : "Categories"}</h3>
            <button onClick={() => setShowAddCat(!showAddCat)} className="text-sm text-blue-600">
              {language === "ar" ? "إضافة" : "Add"}
            </button>
          </div>

          {showAddCat && (
            <div className="flex gap-2 mb-2">
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1 p-2 border rounded dark:bg-gray-900" placeholder={language === "ar" ? "اسم التصنيف" : "Category name"} />
              <button onClick={addCategory} className="px-3 py-2 bg-blue-600 text-white rounded">
                {language === "ar" ? "حفظ" : "Save"}
              </button>
            </div>
          )}

          <div className="space-y-2">
            {categories.map((c: Category) => (
              <div key={c.id} className="flex items-center gap-2">
                {editingId === c.id ? (
                  <>
                    <input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="flex-1 p-2 border rounded dark:bg-gray-900" />
                    <button onClick={saveEdit} className="px-3 py-2 bg-green-600 text-white rounded">
                      {language === "ar" ? "حفظ" : "Save"}
                    </button>
                    <button onClick={() => { setEditingId(null); setEditingName(""); }} className="px-3 py-2 bg-gray-200 rounded">
                      {language === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{c.name}</span>
                    <button onClick={() => startEdit(c.id, c.name)} className="px-3 py-1 bg-yellow-200 rounded text-sm">
                      {language === "ar" ? "تعديل" : "Edit"}
                    </button>
                    <button onClick={() => onDeleteCategory(c.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm">
                      {language === "ar" ? "حذف" : "Delete"}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onOpenSecurity} className="flex-1 text-white py-2 rounded-lg bg-blue-500">
            {language === "ar" ? "🔒 تأمين التطبيق" : "🔒 App security"}
          </button>
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-500 text-white">
            {language === "ar" ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================================
   AiModal
   ================================ */
const AiModal = ({ onClose, language }: any) => (
  <div className="fixed inset-0 bg-black/40 flex items-end z-50">
    <div className="bg-white dark:bg-gray-800 w-full p-4 rounded-t-2xl shadow-lg text-gray-900 dark:text-gray-100">
      <h2 className="text-lg font-bold mb-4">🤖 {language === "ar" ? "المساعد الذكي" : "Smart Assistant"}</h2>
      <p className="text-gray-600 dark:text-gray-300">{language === "ar" ? "هنا ستظهر ميزات المساعد الذكي لاحقًا." : "AI features will appear here."}</p>
      <button onClick={onClose} className="mt-4 w-full text-white py-2 rounded-lg bg-blue-500">
        {language === "ar" ? "إغلاق" : "Close"}
      </button>
    </div>
  </div>
);
