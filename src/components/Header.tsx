// src/components/Header.tsx
import React from "react";

type Tabs = "dashboard" | "tasks" | "calendar" | "goals";

interface HeaderProps {
  activeTab: Tabs;
  setActiveTab: (tab: Tabs) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="w-full shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">تطبيق الإنتاجية</h1>
        </div>

        <nav className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1 rounded ${activeTab === "dashboard" ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-300"}`}
            aria-pressed={activeTab === "dashboard"}
          >
            لوحة القيادة
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3 py-1 rounded ${activeTab === "tasks" ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-300"}`}
            aria-pressed={activeTab === "tasks"}
          >
            المهام
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-3 py-1 rounded ${activeTab === "calendar" ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-300"}`}
            aria-pressed={activeTab === "calendar"}
          >
            التقويم
          </button>

          <button
            onClick={() => setActiveTab("goals")}
            className={`px-3 py-1 rounded ${activeTab === "goals" ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-300"}`}
            aria-pressed={activeTab === "goals"}
          >
            الأهداف
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header; // أضفت أيضاً default export لمرونة الاستيراد
